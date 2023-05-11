package ru.saltykov.diploma.messages;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Data;

@Data
public class CollaborationMessageWrapper {
    private String type;

    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type", include = JsonTypeInfo.As.EXTERNAL_PROPERTY)
    @JsonSubTypes(value = {
            @JsonSubTypes.Type(value = ChatMessage.class, name = "CHAT"),
            @JsonSubTypes.Type(value = CursorUpdate.class, name = "CURSOR"),
            @JsonSubTypes.Type(value = DocumentChange.class, name = "CHANGES"),
            @JsonSubTypes.Type(value = StatusUpdate.class, name = "STATUS"),
    })
    private CollaborationMessage message;
}
