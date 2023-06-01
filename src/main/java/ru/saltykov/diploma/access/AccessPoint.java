package ru.saltykov.diploma.access;

import org.springframework.data.util.Pair;
import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.List;

public interface AccessPoint {

    //document changes
    DocumentChange insertChanges(DocumentChange changes);
    List<DocumentChange> getChangesFrom(Long revId);
    void addText(Long revId, String text);
    Pair<Long, String> getLastText();
    String getText(Long revId);

    //chat
    void addMessage(ChatMessage message);
    List<ChatMessage> getMessagesFrom(Long messageId);
    Integer getMessageHead();
}
