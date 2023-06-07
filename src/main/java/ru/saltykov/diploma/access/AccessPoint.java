package ru.saltykov.diploma.access;

import org.springframework.data.util.Pair;
import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.messages.StatusUpdate;

import java.util.List;
import java.util.UUID;

public interface AccessPoint {

    //document changes
    DocumentChange insertChanges(UUID fileid, DocumentChange changes);
    List<DocumentChange> getChangesFrom(UUID fileid, Integer revId);
    void addText(UUID fileid, Integer revId, String text);
    Pair<Integer, String> getLastText(UUID fileid);
    String getText(UUID fileid, Integer revId);

    //chat
    ChatMessage addMessage(UUID fileid, ChatMessage message);
    List<ChatMessage> getMessagesFrom(UUID fileid, Integer messageId);
    Integer getMessageHead(UUID fileid);

    //status
    void setStatus(UUID file, UUID user, String status, String value);
    List<StatusUpdate> getStatuses(UUID file);
}
