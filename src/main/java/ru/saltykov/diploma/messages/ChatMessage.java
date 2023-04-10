package ru.saltykov.diploma.messages;

import lombok.Builder;
import lombok.Data;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;

@Data
@Builder
@Jacksonized
public class ChatMessage {
    String user;
    String message;
    LocalDateTime timeStamp;
}
