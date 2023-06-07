package ru.saltykov.diploma.access;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import ru.saltykov.diploma.domain.CollabChanges;
import ru.saltykov.diploma.domain.CollabMessage;
import ru.saltykov.diploma.messages.ChatMessage;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.messages.StatusUpdate;
import ru.saltykov.diploma.repositories.ChangesRepository;
import ru.saltykov.diploma.repositories.MessageRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class H2AccessPoint implements AccessPoint{
    @Autowired
    MessageRepository messageRepository;
    @Autowired
    ChangesRepository changesRepository;

    @Override
    public DocumentChange insertChanges(UUID fileId, DocumentChange changes) {
        CollabChanges collabChanges = new CollabChanges(null, fileId, changes.getUser() != null ? UUID.fromString(changes.getUser()) : null, changes.getRevision(), changes.getChanges());
        changesRepository.insertChanges(collabChanges);
        collabChanges = changesRepository.getChanges(collabChanges.getId());
        return DocumentChange.builder()
                .user(collabChanges.getUser() != null ? collabChanges.getUser().toString() : null)
                .revision(collabChanges.getRevision())
                .changes(collabChanges.getChangesstring())
                .build();
    }

    @Override
    public List<DocumentChange> getChangesFrom(UUID fileId, Integer revId) {
        return changesRepository
                .getChangesFrom(fileId, revId)
                .stream()
                .map(e -> DocumentChange.builder()
                        .user(e.getUser() != null ? e.getUser().toString() : null)
                        .changes(e.getChangesstring())
                        .revision(e.getRevision())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void addText(UUID fileId, Integer revId, String text) {

    }

    @Override
    public Pair<Integer, String> getLastText(UUID fileId) {
        return null;
    }

    @Override
    public String getText(UUID fileId, Integer revId) {
        return "";
    }

    @Override
    public ChatMessage addMessage(UUID fileId, ChatMessage message) {
        CollabMessage collabMessage = new CollabMessage(null, fileId, message.getUser() != null ? UUID.fromString(message.getUser()) : null, null, message.getMessageid(), message.getMessage());
        messageRepository.addMessage(collabMessage);
        collabMessage = messageRepository.getMessageById(collabMessage.getId());
        return ChatMessage.builder()
                .timestamp(collabMessage.getTimestamp())
                .messageid(collabMessage.getMessageid())
                .message(collabMessage.getMessage())
                .user(message.getUser())
                .build();
    }

    @Override
    public List<ChatMessage> getMessagesFrom(UUID fileId, Integer messageId) {
        return messageRepository.getMessages(fileId, messageId)
                .stream()
                .map(e -> ChatMessage.builder()
                        .user(e.getUser() != null ? e.getUser().toString() : null)
                        .message(e.getMessage())
                        .timestamp(e.getTimestamp())
                        .messageid(e.getMessageid())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public Integer getMessageHead(UUID fileId) {
        return Stream.of(messageRepository.getMessageHead(fileId)).filter(Objects::nonNull).findFirst().orElse(0);
    }

    @Override
    public void setStatus(UUID file, UUID user, String status, String value) {

    }

    @Override
    public List<StatusUpdate> getStatuses(UUID file) {
        return null;
    }
}
