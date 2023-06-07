package ru.saltykov.diploma.access;

import org.springframework.data.util.Pair;
import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.messages.StatusUpdate;

import java.util.*;
import java.util.stream.Collectors;

public class InMemoryAccessPoint implements AccessPoint{
    final private HashMap<UUID, HashMap<Integer, DocumentChange>> changesMap = new HashMap<>();
    final private HashMap<UUID, TreeMap<Integer, String>> textMap = new HashMap<>();
    final private HashMap<UUID, TreeMap<Long, ChatMessage>> chatMap = new HashMap<>();

    @Override
    public DocumentChange insertChanges(UUID fileid, DocumentChange changes) {
        changesMap.computeIfAbsent(fileid, e -> new HashMap<>());
        changesMap.get(fileid).put(changes.getRevision(), changes);
        return changes;
    }

    @Override
    public List<DocumentChange> getChangesFrom(UUID fileid, Integer revId) {
        changesMap.computeIfAbsent(fileid, e -> new HashMap<>());
        return changesMap.get(fileid).entrySet().stream().filter(e -> e.getKey() > revId).map(Map.Entry::getValue).collect(Collectors.toList());
    }


    @Override
    public void addText(UUID fileid, Integer revId, String text) {
        textMap.computeIfAbsent(fileid, e -> new TreeMap<>());
        textMap.get(fileid).put(revId, text);
    }

    @Override
    public Pair<Integer, String> getLastText(UUID fileid) {
        textMap.computeIfAbsent(fileid, e -> new TreeMap<>());
        Map.Entry<Integer, String> entry = textMap.get(fileid).lastEntry();
        return entry != null ? Pair.of(entry.getKey(), entry.getValue()) : null;
    }

    @Override
    public String getText(UUID fileid, Integer revId) {
        textMap.computeIfAbsent(fileid, e -> new TreeMap<>());
        return textMap.get(fileid).get(revId);
    }

    @Override
    public ChatMessage addMessage(UUID fileid, ChatMessage message) {
        chatMap.computeIfAbsent(fileid, e -> new TreeMap<>());
        chatMap.get(fileid).put((long)chatMap.get(fileid).size(), message);
        return message;
    }

    @Override
    public List<ChatMessage> getMessagesFrom(UUID fileid, Integer messageId) {
        chatMap.computeIfAbsent(fileid, e -> new TreeMap<>());
        return chatMap.get(fileid)
                .entrySet().stream()
                .filter(e -> e.getKey() >= messageId)
                .map(Map.Entry::getValue).collect(Collectors.toList());
    }

    @Override
    public Integer getMessageHead(UUID fileid) {
        chatMap.computeIfAbsent(fileid, e -> new TreeMap<>());
        return chatMap.get(fileid).size();
    }

    @Override
    public void setStatus(UUID file, UUID user, String status, String value) {

    }

    @Override
    public List<StatusUpdate> getStatuses(UUID file) {
        return null;
    }
}
