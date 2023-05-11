package ru.saltykov.diploma.messages;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.jackson.Jacksonized;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@Jacksonized
public class CursorUpdate extends CollaborationMessage{
    String position;
    String rev;
}
