package ru.saltykov.diploma.access;

import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;

import javax.print.Doc;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class InMemoryAccessPoint implements AccessPoint{
    final private HashMap<Long, DocumentChange> changesMap = new HashMap<>();
    @Override
    public DocumentChange insertChanges(DocumentChange changes) {
        changesMap.put(changes.getRevision(), changes);
        return changes;
    }

    @Override
    public List<DocumentChange> getChangesFrom(Long revId) {
        return changesMap.entrySet().stream().filter(e -> e.getKey() > revId).map(Map.Entry::getValue).collect(Collectors.toList());
    }

    @Override
    public List<ChatMessage> getMessagesFrom(Long messageId) {
        return null;
    }
}
