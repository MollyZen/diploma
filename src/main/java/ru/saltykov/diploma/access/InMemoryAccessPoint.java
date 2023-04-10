package ru.saltykov.diploma.access;

import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.List;

public class InMemoryAccessPoint implements AccessPoint{
    @Override
    public DocumentChange insertChanges(DocumentChange changes) {
        return changes;
    }

    @Override
    public List<DocumentChange> getChangesFrom(Long revId) {
        return null;
    }

    @Override
    public List<ChatMessage> getMessagesFrom(Long messageId) {
        return null;
    }
}
