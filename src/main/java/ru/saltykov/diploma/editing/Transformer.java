package ru.saltykov.diploma.editing;

import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class Transformer {
    AccessPoint accessPoint;
    String fileId;
    Long revision = null;

    public Transformer(AccessPoint accessPoint, String fileId) {
        this.accessPoint = accessPoint;
        this.fileId = fileId;
    }

    synchronized DocumentChange applyChanges(DocumentChange changes){
        DocumentChange transformed = null;
        try{
             transformed = parse(changes);
            accessPoint.insertChanges(transformed);
        }catch (Exception ignoed){}

        return transformed;
    }

    private DocumentChange parse(DocumentChange changes) throws Exception{
        List<DocumentChange> prevChanges = new ArrayList<>();
        if (revision - changes.getRevision()  > 1) {
            prevChanges = accessPoint.getChangesFrom(changes.getRevision());
            ParsedChanges transformed = parseChanges(changes);
            for (DocumentChange prevChange : prevChanges)
                transformed = transform(transformed, prevChange);
            return transformed.toDocumentChange();
        }
        else
            return changes;
    }

    private ParsedChanges transform(ParsedChanges changes, DocumentChange prevChanges){
        ParsedChanges transformed = new ParsedChanges();
        transformed.setRevision(changes.getRevision() + 1);
        transformed.setUser(changes.getUser());

        ParsedChanges prevParsed = parseChanges(prevChanges);

        Long affectedStart = changes.getStart();
        long affectedEnd = changes.getStart() + changes.getLength();

        Long prevAffectedStart = prevParsed.getStart();
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
        ParsedChanges res = new ParsedChanges();
        res.setUser(changes.getUser());
        res.setRevision(changes.getRevision());

        String newChanges = changes.getChanges();
        String[] split = newChanges.split("#");

        //start + length
        boolean negative = split[0].contains("-");
        String[] subsplit = split[0].split("[+-]");
        res.setStart(Long.parseLong(subsplit[0]));
        res.setLength(Long.parseLong(subsplit[1]) * (negative ? -1 : 1));

        //tokens
        subsplit = split[1].split(" ");
        res.setTokens(Arrays.stream(subsplit).map(e -> new FormattedToken(e.substring(0, 1), Long.parseLong(e.substring(1)))).collect(Collectors.toList()));

        //text
        res.setText(split[2]);

        return res;
    }
}
