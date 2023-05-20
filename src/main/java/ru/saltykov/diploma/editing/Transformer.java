package ru.saltykov.diploma.editing;

import lombok.SneakyThrows;
import org.springframework.data.util.Pair;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.storage.DataStorage;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class Transformer {
    private AccessPoint accessPoint;
    private DataStorage dataStorage;
    private String fileId;
    private Long revision = 0L;

    private List<Principal> users = new ArrayList<>();

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
        Pair<Long, String> lastText = accessPoint.getLastText();
        List<DocumentChange> changes = new ArrayList<>();
        if (lastText != null) {
            builder.append(lastText.getSecond());
            changes.addAll(accessPoint.getChangesFrom(lastText.getFirst()));
        }
        else{
            changes.addAll(accessPoint.getChangesFrom(0L));
        }
        List<ParsedChanges> parsedChanges = changes.stream().map(this::parseChanges).toList();
        for (ParsedChanges parsedChange : parsedChanges){
            AtomicInteger mainPointer = new AtomicInteger(parsedChange.getStart());
            AtomicInteger subPointer = new AtomicInteger(0);
            String text = parsedChange.getText();
            parsedChange
                    .getTokens()
                    .stream()
                    .filter(e -> e.getToken().equals(AllowedTokens.CHAR_ADDED) ||
                            e.getToken().equals(AllowedTokens.CHAR_REMOVED) ||
                            e.getToken().equals(AllowedTokens.CHAR_KEPT))
                    .forEach(e -> {
                        switch (e.getToken()) {
                            case AllowedTokens.CHAR_ADDED -> {
                                builder.insert(mainPointer.get(), text.substring(subPointer.get(), subPointer.get() + e.getValue()));
                                subPointer.addAndGet(e.getValue());
                                mainPointer.addAndGet(e.getValue());
                            }
                            case AllowedTokens.CHAR_REMOVED ->
                                    builder.replace(mainPointer.get(), mainPointer.get() + e.getValue(), "");
                            case AllowedTokens.CHAR_KEPT ->
                                    mainPointer.addAndGet(e.getValue());
                        }
                    });
        }

        return builder.toString();
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
                .matcher(split[1]);
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

    public void addUser(Principal user){
        users.add(user);
        System.out.println("Connected users: " + users.stream().map(Principal::getName).collect(Collectors.joining(", ")));
    }

    public void removeUser(Principal user){
        users.remove(user);
        System.out.println("Connected users: " + users.stream().map(Principal::getName).collect(Collectors.joining(", ")));
    }

    public List<Principal> getUsers(){
        return users;
    }
}
