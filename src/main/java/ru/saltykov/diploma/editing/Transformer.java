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
        accessPoint.insertChanges(transformed);
        ++revision;

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
                                builder.insert(mainPointer.get(), text.substring(subPointer.get(), e.getValue()));
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
            for (DocumentChange prevChange : prevChanges)
                transformed = transform(transformed, prevChange);
        }
        transformed.setRevision(revision + 1);
        return transformed.toDocumentChange();
    }

    private ParsedChanges transform(ParsedChanges changes, DocumentChange prevChanges){
        ParsedChanges transformed = new ParsedChanges();
        transformed.setRevision(changes.getRevision() + 1);
        transformed.setUser(changes.getUser());

        ParsedChanges prevParsed = parseChanges(prevChanges);

        Integer affectedStart = changes.getStart();
        long affectedEnd = changes.getStart() + changes.getLength();

        Integer prevAffectedStart = prevParsed.getStart();
        long prevAffectedEnd = prevParsed.getStart() + prevParsed.getLength();

        if (affectedStart < prevAffectedStart && affectedEnd < prevAffectedStart){
            return changes;
        }
        else if (affectedStart > prevAffectedEnd){
            transformed.setStart(changes.getStart() + prevParsed.getCharLengthChange());
        }
        else {

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
