package ru.saltykov.diploma.editing;

import lombok.Getter;
import lombok.SneakyThrows;
import org.springframework.data.util.Pair;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.config.StompPrincipal;
import ru.saltykov.diploma.domain.CollabUser;
import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.storage.DataStorage;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class Transformer {
    private final LinkedHashSet<String> randomNames = new LinkedHashSet<>(){{
        add("Анонимный гений");
        add("Анонимный аноним");
        add("Анонимный писатель");
        add("Анонимный поэт");
        add("Анонимный редактор");
        add("Анонимный прозаик");
    }};
    private final AccessPoint accessPoint;
    private final DataStorage dataStorage;
    @Getter
    private final UUID fileId;
    private Integer revision = 0;

    private final Set<StompPrincipal> users = new HashSet<>();
    private final Map<String, String> anonymousUserNames = new HashMap<>();
    private final Map<StompPrincipal, Integer> instancesCount = new HashMap<>();

    public Transformer(AccessPoint accessPoint, DataStorage dataStorage, String fileId) {
        this.accessPoint = accessPoint;
        this.dataStorage = dataStorage;
        this.fileId = UUID.fromString(fileId);
    }

    @SneakyThrows
    synchronized public DocumentChange applyChanges(DocumentChange changes){
        DocumentChange transformed = null;
        transformed = parse(changes);
        if (transformed != null) {
            accessPoint.insertChanges(fileId, transformed);
            ++revision;
        }

        return transformed;
    }

    synchronized public void insertText(){
        String text = combineChanges(revision);
        accessPoint.addText(fileId, revision, text);
        if (dataStorage != null)
            dataStorage.updateFile(fileId, text);
    }

    private String combineChanges(Integer revId){
        StringBuilder builder = new StringBuilder();
        StringBuilder resText = new StringBuilder();
        Pair<Integer, String> lastText = accessPoint.getLastText(fileId);
        List<DocumentChange> changes = new ArrayList<>();
        if (lastText != null) {
            changes.add(DocumentChange.builder().changes(lastText.getSecond()).revision(lastText.getFirst()).build());
            changes.addAll(accessPoint.getChangesFrom(fileId, lastText.getFirst()));
        }
        else{
            changes.addAll(accessPoint.getChangesFrom(fileId, 0));
        }
        List<ParsedChanges> parsedChanges = changes.stream().map(this::parseChanges).toList();
        TreeMap<String, String> formatting = new TreeMap<>();
        DataRope rope = new DataRope();
        for (ParsedChanges parsedChange : parsedChanges){
            String remainingText = parsedChange.getText();
            int pos = parsedChange.getStart();
            int initialLength = rope.getRopeRoot().getLength();
            int targetDiff = parsedChange.getCharLengthChange();
            for (FormattedToken token : parsedChange.getTokens()){
                switch (token.getToken()){
                    case AllowedTokens.CHAR_ADDED -> {
                        String style = formatting.entrySet().stream().map(e -> e.getKey() + ":" + e.getValue()).collect(Collectors.joining(" "));
                        String toInsert = remainingText.substring(0, token.getValue());
                        rope.ropeInsertText(toInsert, style, pos);
                        pos += toInsert.length();
                        remainingText = remainingText.substring(toInsert.length());
                        formatting = new TreeMap<>();
                    }
                    case AllowedTokens.CHAR_REMOVED -> {
                        rope.ropeDeleteText(pos, token.getValue());
                    }
                    case AllowedTokens.CHAR_KEPT -> {
                        pos += token.getValue();
                        //TODO: здесь и во фронте сделать
                    }
                    case AllowedTokens.APPLY_FORMATTING -> {
                        formatting.put(token.getValue().toString(), token.getSubValue());
                    }
                }
            }
        }

        int cnt = 0;
        DataRope.TreeNode node = rope.getRopeRoot().nextTextNode();
        String lastFormatting = node != null ? node.getStyle() : null;
        while (node != null){
            if (lastFormatting.equals(node.getStyle()))
                cnt += node.getText().length();
            else{
                String f = lastFormatting.replaceAll(" ", "*");
                if (f.length() > 0) f = "*" + f;
                builder.append(f).append("+").append(cnt);
                cnt = node.getText().length();
                lastFormatting = node.getStyle();
            }
            resText.append(node.getText());
            node = node.nextTextNode();
        }
        if (cnt > 0) {
            String f = lastFormatting.replaceAll(" ", "*");
            if (f.length() > 0) f = "*" + f;
            builder.append(f).append("+").append(cnt);
        }

        return "0+" + resText.length() + "#" + builder.toString() + "#" + resText.toString();
    }

    private DocumentChange parse(DocumentChange changes) throws Exception{
        List<DocumentChange> prevChanges = new ArrayList<>();
        ParsedChanges transformed = parseChanges(changes);
        if (revision - changes.getRevision() > 0) {
            prevChanges = accessPoint.getChangesFrom(fileId, changes.getRevision());
            for (DocumentChange prevChange : prevChanges) {
                transformed = transform(transformed, prevChange);
                if (transformed.getTokens().size() == 0) break;
            }
        }
        transformed.setRevision(revision + 1);
        return transformed.getTokens().size() > 0 ? transformed.toDocumentChange() : null;
    }

    private ParsedChanges transform(ParsedChanges changes, DocumentChange prevChanges){
        ParsedChanges transformed = new ParsedChanges();
        transformed.setRevision(changes.getRevision() + 1);
        transformed.setUser(changes.getUser());

        ParsedChanges prevParsed = parseChanges(prevChanges);

        int affectedStart = changes.getStart();
        int affectedEnd = changes.getStart() +
                changes.getTokens().stream()
                        .filter(e -> !e.getToken().equals(AllowedTokens.APPLY_FORMATTING) && !e.getToken().equals(AllowedTokens.CHAR_ADDED))
                        .mapToInt(FormattedToken::getValue)
                        .sum();

        int prevAffectedStart = prevParsed.getStart();
        int prevAffectedEnd = prevParsed.getStart() +
                prevParsed.getTokens().stream()
                        .filter(e -> !e.getToken().equals(AllowedTokens.APPLY_FORMATTING) && !e.getToken().equals(AllowedTokens.CHAR_ADDED))
                        .mapToInt(FormattedToken::getValue)
                        .sum();

        //new changes fully before old ones
        if (affectedStart < prevAffectedStart && affectedEnd < prevAffectedStart){
            transformed.setStart(changes.getStart());
            transformed.setText(changes.getText());
            transformed.setLength(changes.getLength());
            transformed.setTokens(changes.getTokens());
        }
        //new changes fully after old ones
        else if (affectedStart > prevAffectedEnd){
            transformed.setStart(changes.getStart() + prevParsed.getLength());
            transformed.setText(changes.getText());
            transformed.setLength(changes.getLength());
            transformed.setTokens(changes.getTokens());
        }
        else{
            List<Pair<FormattedToken, List<FormattedToken>>> resChanges = new ArrayList<>();
            List<Pair<FormattedToken, List<FormattedToken>>> newChanges = changes.getGroupedTokens();
            List<Pair<FormattedToken, List<FormattedToken>>> oldChanges = prevParsed.getGroupedTokens();

            int pos = changes.getStart();
            int oldPos = prevParsed.getStart();

            int startAdjustment = 0;

            List<Pair<FormattedToken, List<FormattedToken>>> tmp = new ArrayList<>();
            newChanges.forEach(val -> {
                if (!val.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED))
                    for (int i = 0; i < val.getFirst().getValue(); ++i)
                        tmp.add(Pair.of(new FormattedToken(val.getFirst().getToken(), 1, null), val.getSecond()));
                else
                    tmp.add(val);
            });
            newChanges.clear();
            newChanges.addAll(tmp);
            tmp.clear();
            oldChanges.forEach(val -> {
                if (!val.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED))
                    for (int i = 0; i < val.getFirst().getValue(); ++i)
                        tmp.add(Pair.of(new FormattedToken(val.getFirst().getToken(), 1, null), val.getSecond()));
                else
                    tmp.add(val);
            });
            oldChanges.clear();
            oldChanges.addAll(tmp);
            tmp.clear();

            while (newChanges.size() > 0){
                if (oldChanges.size() == 0){
                    resChanges.addAll(newChanges);
                    newChanges.clear();
                    break;
                }
                Pair<FormattedToken, List<FormattedToken>> prev = oldChanges.get(0);
                Pair<FormattedToken, List<FormattedToken>> cur = newChanges.get(0);
                //if cur changes start before old ones
                if (pos < oldPos){
                    newChanges.remove(0);
                    if (cur.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)){
                        resChanges.add(cur);
                    }
                    else if (cur.getFirst().getToken().equals(AllowedTokens.CHAR_REMOVED)){
                        resChanges.add(cur);
                        pos += cur.getFirst().getValue();
                    }
                    else {
                        resChanges.add(cur);
                        pos += cur.getFirst().getValue();
                    }
                }
                // old parts before current changes
                else if(oldPos < pos){
                    oldChanges.remove(0);
                    if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_REMOVED)) {
                        if (resChanges.size() == 0) startAdjustment += Integer.parseInt(prev.getFirst().getToken() + prev.getFirst().getValue());
                        oldPos += prev.getFirst().getValue();
                    }
                    else if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)){
                        if (resChanges.size() == 0)
                            startAdjustment += Integer.parseInt(prev.getFirst().getToken() + prev.getFirst().getValue());
                        else {
                            resChanges.add(Pair.of(new FormattedToken(AllowedTokens.CHAR_KEPT, prev.getFirst().getValue(), null), prev.getSecond()));
                            pos += prev.getFirst().getValue();
                        }
                    }
                    else {
                        oldPos += prev.getFirst().getValue();
                    }
                }
                //match
                else {
                    switch (cur.getFirst().getToken()) {
                        case AllowedTokens.CHAR_ADDED -> {
                            if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)) {
                                resChanges.add(Pair.of(new FormattedToken(AllowedTokens.CHAR_KEPT, prev.getFirst().getValue(), null), new ArrayList<>()));
                                resChanges.add(cur);
                                oldChanges.remove(0);
                                newChanges.remove(0);
                            }
                            else if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_REMOVED)) {
                                int id;
                                for (id = 1; id < oldChanges.size(); ++id) {
                                    if (oldChanges.get(id).getFirst().getToken().equals(AllowedTokens.CHAR_ADDED))
                                        break;
                                    else if (!oldChanges.get(id).getFirst().getToken().equals(AllowedTokens.CHAR_REMOVED)){
                                        id = -1;
                                        break;
                                    }
                                }
                                if (id > 0 && id != oldChanges.size()){
                                    oldChanges.set(0, oldChanges.get(id));
                                    oldChanges.set(id, prev);
                                }
                                else {
                                    resChanges.add(cur);
                                    newChanges.remove(0);
                                }
                            }
                            else {
                                resChanges.add(cur);
                                newChanges.remove(0);
                            }
                        }
                        case AllowedTokens.CHAR_REMOVED -> {
                            if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)) {
                                resChanges.add(Pair.of(new FormattedToken(AllowedTokens.CHAR_KEPT, prev.getFirst().getValue(), null), new ArrayList<>()));
                                oldChanges.remove(0);
                            } else if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_REMOVED)) {
                                oldChanges.remove(0);
                                newChanges.remove(0);
                            } else {
                                resChanges.add(cur);
                                oldChanges.remove(0);
                                newChanges.remove(0);
                            }
                        }
                        case AllowedTokens.CHAR_KEPT -> {
                            if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)) {
                                resChanges.add(Pair.of(new FormattedToken(AllowedTokens.CHAR_KEPT, prev.getFirst().getValue(), null), new ArrayList<>()));
                                oldChanges.remove(0);
                            } else if (prev.getFirst().getToken().equals(AllowedTokens.CHAR_REMOVED)) {
                                oldChanges.remove(0);
                                newChanges.remove(0);
                            } else {
                                Map<Integer, String> tmpMap = new TreeMap<>();
                                prev.getSecond().forEach(val -> {
                                    tmpMap.put(val.getValue(), val.getSubValue());
                                });
                                cur.getSecond().forEach(val -> {
                                    tmpMap.put(val.getValue(), val.getSubValue());
                                });
                                resChanges.add(Pair.of(cur.getFirst(),
                                        tmpMap.entrySet().stream()
                                                .map(e -> new FormattedToken(AllowedTokens.APPLY_FORMATTING, e.getKey(), e.getValue()))
                                                .collect(Collectors.toList())));
                                oldChanges.remove(0);
                                newChanges.remove(0);
                            }
                        }
                    }
                }
            }

            List<FormattedToken> unwinded = new ArrayList<>();
            AtomicInteger length = new AtomicInteger(0);
            resChanges.forEach(val -> {
                unwinded.addAll(val.getSecond());
                unwinded.add(val.getFirst());
                if (!val.getFirst().getToken().equals(AllowedTokens.CHAR_KEPT)) length.addAndGet(val.getFirst().getValue());
            });

            transformed.setStart(changes.getStart() + startAdjustment);
            transformed.setText(changes.getText());
            transformed.setLength(length.get());
            transformed.setTokens(unwinded);
        }

        return transformed;
    }

    private ParsedChanges parseChanges(DocumentChange changes){
        //формат позиция(+-)изменение_длины#токены#текст
        ParsedChanges res = new ParsedChanges();
        res.setUser(changes.getUser());
        res.setRevision(changes.getRevision());

        String newChanges = changes.getChanges();
        String[] split = newChanges.split("#");

        //start + length
        boolean negative = split[0].contains("-");
        String[] subsplit = split[0].split("[+-]");
        res.setStart(Integer.parseInt(subsplit[0]));
        res.setLength(Integer.parseInt(subsplit[1]) * (negative ? -1 : 1));

        //tokens
        Matcher m = Pattern.compile("([\\-+=]|\\*[0-9]+:)[0-9]+")
                .matcher(split.length > 1 ? split[1] : "");
        List<String> tmp = new ArrayList<>();
        while (m.find())
            tmp.add(m.group());

        subsplit = tmp.toArray(new String[0]);
        res.setTokens(Arrays.stream(subsplit).map(e -> {
            int colonId = e.lastIndexOf(':');
            if (colonId >= 0)
                return new FormattedToken(e.substring(0, 1), Integer.parseInt(e.substring(1,colonId)), e.substring(colonId + 1));
            else
                return new FormattedToken(e.substring(0, 1), Integer.parseInt(e.substring(1)), null);
        }).collect(Collectors.toList()));

        //text
        if (split.length == 3)
            res.setText(split[2]);
        else
            res.setText("");

        return res;
    }

    public void addUser(StompPrincipal user){
        users.add(user);
        Integer instances = this.instancesCount.get(user);
        if (instances == null)
            instances = 0;
        ++instances;
        this.instancesCount.put(user, instances);
        if (user.getCorePrincipal() instanceof Authentication){
            if (((Authentication) user.getCorePrincipal()).getAuthorities().stream().anyMatch(e -> e.getAuthority().equals("ROLE_ANONYMOUS"))){
                String randomName = randomNames.stream().findFirst().get();
                randomNames.remove(randomName);
                randomNames.add(randomName);
                anonymousUserNames.put(user.getName(), randomName);
            }
        }
        System.out.println("Connected users: " + users.stream().map(e -> e.getCorePrincipal().getName()).collect(Collectors.joining(", ")));
    }

    public void removeUser(StompPrincipal user){
        Integer cnt = this.instancesCount.get(user);
        --cnt;
        this.instancesCount.put(user, cnt);
        if (cnt == 0)
            users.remove(user);
        System.out.println("Connected users: " + users.stream().map(e -> e.getCorePrincipal().getName()).collect(Collectors.joining(", ")));
    }

    public Set<StompPrincipal> getUsers(){
        return users;
    }

    public String getUsername(StompPrincipal user){
        if (anonymousUserNames.get(user.getName()) != null)
            return anonymousUserNames.get(user.getName());
        else
            return ((CollabUser)((UsernamePasswordAuthenticationToken)user.getCorePrincipal()).getPrincipal()).getDisplayname();
    }

    public ChatMessage addMessage(ChatMessage message) {
        message.setTimestamp(LocalDateTime.now().atZone(ZoneId.systemDefault()).toEpochSecond());
        message.setMessageid(accessPoint.getMessageHead(fileId));
        accessPoint.addMessage(fileId, message);
        return message;
    }

    public List<ChatMessage> getMessagesFrom(Integer messageId) {
        return accessPoint.getMessagesFrom(fileId, messageId);
    }
}
