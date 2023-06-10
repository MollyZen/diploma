package ru.saltykov.diploma.messages;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;
import lombok.extern.jackson.Jacksonized;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Jacksonized
public class ChatMessage extends CollaborationMessage{
    Long timestamp;
    Integer messageid;
    String message;
}
