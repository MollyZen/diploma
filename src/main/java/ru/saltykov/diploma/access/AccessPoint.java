package ru.saltykov.diploma.access;

import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.List;

public interface AccessPoint {

    DocumentChange insertChanges(DocumentChange changes);
    List<DocumentChange> getChangesFrom(Long revId);
    List<ChatMessage> getMessagesFrom(Long messageId);
}
