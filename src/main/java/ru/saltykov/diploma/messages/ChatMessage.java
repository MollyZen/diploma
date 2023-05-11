package ru.saltykov.diploma.messages;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@Jacksonized
public class ChatMessage extends CollaborationMessage{
    String message;
}
