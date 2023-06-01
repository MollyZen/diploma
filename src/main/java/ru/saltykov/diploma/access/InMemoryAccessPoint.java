package ru.saltykov.diploma.access;

import org.springframework.data.util.Pair;
import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class InMemoryAccessPoint implements AccessPoint{
    final private HashMap<Long, DocumentChange> changesMap = new HashMap<>();
    final private TreeMap<Long, String> textMap = new TreeMap<>();
    final private TreeMap<Long, ChatMessage> chatMap = new TreeMap<>();

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
    public void addText(Long revId, String text) {
        textMap.put(revId, text);
    }

    @Override
    public Pair<Long, String> getLastText() {
        Map.Entry<Long, String> entry = textMap.lastEntry();
        return entry != null ? Pair.of(entry.getKey(), entry.getValue()) : null;
    }

    @Override
    public String getText(Long revId) {
        return textMap.get(revId);
    }

    @Override
    public void addMessage(ChatMessage message) {

    }

    @Override
    public List<ChatMessage> getMessagesFrom(Long messageId) {
        return null;
    }

    @Override
    public Integer getMessageHead() {
        return changesMap.size();
    }
}
