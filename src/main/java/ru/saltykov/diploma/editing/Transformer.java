package ru.saltykov.diploma.editing;

import lombok.Getter;
import lombok.SneakyThrows;
import org.springframework.data.util.Pair;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.parameters.P;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.config.StompPrincipal;
import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.storage.DataStorage;

import java.security.Principal;
import java.time.LocalDateTime;
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
    private final String fileId;
    private Long revision = 0L;

    private final Set<StompPrincipal> users = new HashSet<>();
    private final Map<String, String> anonymousUserNames = new HashMap<>();
    private final Map<StompPrincipal, Integer> instancesCount = new HashMap<>();

    public Transformer(AccessPoint accessPoint, DataStorage dataStorage, String fileId) {
        this.accessPoint = accessPoint;
        this.dataStorage = dataStorage;
        this.fileId = fileId;
    }

    @SneakyThrows
    synchronized public DocumentChange applyChanges(DocumentChange changes){
        DocumentChange transformed = null;
        transformed = parse(changes);
        if (transformed != null) {
            accessPoint.insertChanges(transformed);
            ++revision;
        }

        return transformed;
    }

    synchronized public void insertText(){
        String text = combineChanges(revision);
        accessPoint.addText(revision, text);
        if (dataStorage != null)
            dataStorage.updateFile(fileId, text);
    }

    private String combineChanges(Long revId){
        StringBuilder builder = new StringBuilder();
        StringBuilder resText = new StringBuilder();
        Pair<Long, String> lastText = accessPoint.getLastText();
        List<DocumentChange> changes = new ArrayList<>();
        if (lastText != null) {
            changes.add(DocumentChange.builder().changes(lastText.getSecond()).revision(lastText.getFirst()).build());
            changes.addAll(accessPoint.getChangesFrom(lastText.getFirst()));
        }
        else{
            changes.addAll(accessPoint.getChangesFrom(0L));
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
                        //TODO: здесь и во фронте сделать
                    }
                    case AllowedTokens.APPLY_FORMATTING -> {
                        formatting.put(token.getValue().toString(), token.getSubValue());
                    }
                }
            }
            System.out.println("SOMETHIN WENT WRONG");
        }

        int cnt = 0;
        DataRope.TreeNode node = rope.getRopeRoot().nextTextNode();
        String lastFormatting = node != null ? node.getStyle() : null;
        while (node != null){
            if (lastFormatting.equals(node.getStyle()))
                cnt += node.getText().length();
            else{
                builder.append("*").append(lastFormatting.replaceAll(" ", "*")).append("+").append(cnt);
                cnt = node.getText().length();
                lastFormatting = node.getStyle();
            }
            resText.append(node.getText());
            node = node.nextTextNode();
        }
        if (cnt > 0)
            builder.append("*").append(lastFormatting.replaceAll(" ", "*")).append("+").append(cnt);

        return "0+" + resText.length() + "#" + builder.toString() + "#" + resText.toString();
    }

    private DocumentChange parse(DocumentChange changes) throws Exception{
        List<DocumentChange> prevChanges = new ArrayList<>();
        ParsedChanges transformed = parseChanges(changes);
        if (revision - changes.getRevision() > 0) {
            prevChanges = accessPoint.getChangesFrom(changes.getRevision());
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

        Integer affectedStart = changes.getStart();
        long affectedEnd = changes.getStart() + Math.abs(changes.getLength());

        Integer prevAffectedStart = prevParsed.getStart();
        long prevAffectedEnd = prevParsed.getStart() + Math.abs(prevParsed.getLength());

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

            Integer pos = changes.getStart();
            Integer oldPos = prevParsed.getStart();
            while (newChanges.size() > 0){
                Pair<FormattedToken, List<FormattedToken>> tokenGr = newChanges.get(0);
                boolean keepToken = true;
                while (oldChanges.size() > 0 && (oldPos <= pos || oldPos < pos + tokenGr.getFirst().getValue())){
                    Pair<FormattedToken, List<FormattedToken>> oldTokenGr = oldChanges.get(0);

                    int oldSt = oldPos;
                    int oldEnd = oldPos + oldTokenGr.getFirst().getValue();
                    int newSt = pos;
                    int newEnd = pos + tokenGr.getFirst().getValue();

                    if (newSt != oldSt || newEnd != oldEnd){
                        if (oldTokenGr.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)){
                            if (newSt != oldSt){
                                int firstVal = oldSt - newSt;
                                if (firstVal > 0){
                                    newChanges.remove(0);
                                    newChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), firstVal, null), tokenGr.getSecond()));
                                    newChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), tokenGr.getFirst().getValue() - firstVal, null), tokenGr.getSecond()));
                                    continue;
                                }
                            }
                        }
                        else {
                            newChanges.remove(0);
                            oldChanges.remove(0);
                            //handling current changes
                            int curVal = tokenGr.getFirst().getValue();
                            if (curVal > 0 && newEnd > oldEnd) {
                                curVal -= newEnd - oldEnd;
                                newChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), newEnd - oldEnd, null), tokenGr.getSecond()));
                            }
                            if (curVal > 0 && newSt < oldSt) {
                                curVal -= oldSt - newSt;
                                if (curVal > 0) {
                                    newChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), curVal, null), tokenGr.getSecond()));
                                }
                                newChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), oldSt - newSt, null), tokenGr.getSecond()));
                            }

                            //handling old changes
                            int oldVal = oldTokenGr.getFirst().getValue();
                            if (oldVal > 0 && oldEnd > newEnd) {
                                oldVal -= oldEnd - newEnd;
                                oldChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), oldEnd - newEnd, null), tokenGr.getSecond()));
                            }
                            if (oldVal > 0 && oldSt < newSt) {
                                oldVal -= newSt - oldSt;
                                if (oldVal > 0) {
                                    oldChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), oldVal, null), tokenGr.getSecond()));
                                }
                                oldChanges.add(0, Pair.of(new FormattedToken(tokenGr.getFirst().getToken(), newSt - oldSt, null), tokenGr.getSecond()));
                            }

                            //res
                            tokenGr = newChanges.get(0);
                            continue;
                        }
                    }

                    if (oldTokenGr.getFirst().getToken().equals(AllowedTokens.CHAR_KEPT)){
                        oldPos += oldTokenGr.getFirst().getValue();
                    }
                    else if (tokenGr.getFirst().getToken().equals(AllowedTokens.CHAR_KEPT)){
                        if (oldTokenGr.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)) {
                            //shift
                            resChanges.add(
                                    Pair.of(new FormattedToken(AllowedTokens.CHAR_KEPT, oldTokenGr.getFirst().getValue(),  null),
                                            oldTokenGr.getSecond()));
                        }
                        else {
                            //cancel
                            keepToken = false;
                        }
                    }
                    else if (tokenGr.getFirst().getToken().equals(AllowedTokens.CHAR_REMOVED)) {
                        if (oldTokenGr.getFirst().getToken().equals(AllowedTokens.CHAR_ADDED)) {
                            //shift
                            resChanges.add(
                                    Pair.of(new FormattedToken(AllowedTokens.CHAR_KEPT, oldTokenGr.getFirst().getValue(),  null),
                                            oldTokenGr.getSecond()));
                        }
                        else {
                            //cancel
                            keepToken = false;
                        }
                    }
                    else {
                        //shift
                        resChanges.add(
                                Pair.of(new FormattedToken(AllowedTokens.CHAR_KEPT, oldTokenGr.getFirst().getValue(),  null),
                                        oldTokenGr.getSecond()));
                    }
                    oldChanges.remove(0);
                }
                if (keepToken) resChanges.add(tokenGr);
                newChanges.remove(0);
            }

            List<FormattedToken> unwinded = new ArrayList<>();
            AtomicInteger length = new AtomicInteger(0);
            resChanges.forEach(val -> {
                unwinded.addAll(val.getSecond());
                unwinded.add(val.getFirst());
                if (!val.getFirst().getToken().equals(AllowedTokens.CHAR_KEPT)) length.addAndGet(val.getFirst().getValue());
            });

            transformed.setStart(changes.getStart());
            transformed.setText(changes.getText());
            transformed.setLength(changes.getLength());
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
            return user.getCorePrincipal().getName();
    }

    public ChatMessage addMessage(ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        message.setMessageId(accessPoint.getMessageHead());
        accessPoint.addMessage(message);
        return message;
    }

    public List<ChatMessage> getMessagesFrom(Long messageId) {
        return accessPoint.getMessagesFrom(messageId);
    }
}
