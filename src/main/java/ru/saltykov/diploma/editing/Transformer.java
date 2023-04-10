package ru.saltykov.diploma.editing;

import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.ArrayList;
import java.util.List;

public class Transformer {
    AccessPoint accessPoint;
    String fileId;
    Long revision = null;

    public Transformer(AccessPoint accessPoint, String fileId) {
        this.accessPoint = accessPoint;
        this.fileId = fileId;
    }

    synchronized DocumentChange applyChanges(DocumentChange changes){
        try{
            parse(changes);
        }catch (Exception ex){

        }

        return null;
    }

    private DocumentChange parse(DocumentChange changes) throws Exception{
        List<DocumentChange> prevChanges = new ArrayList<>();
        if (revision - changes.getRevision()  > 1) {
            prevChanges = accessPoint.getChangesFrom(changes.getRevision());
            DocumentChange transformed = changes;
            for (DocumentChange prevChange : prevChanges)
                transformed = transform(transformed, prevChange);
            accessPoint.insertChanges(transformed);
            return transformed;
        }
        else
            return changes;
    }

    private DocumentChange transform(DocumentChange changes, DocumentChange prevChanges){
        DocumentChange transformed = new DocumentChange();
        transformed.setRevision(changes.getRevision() + 1);
        transformed.setUser(changes.getUser());




        String oldChanges = prevChanges.getChanges();



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
        subsplit = split[1].split();


        //text
        res.setText(split[2]);

        return res;
    }
}
