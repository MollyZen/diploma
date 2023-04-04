package ru.saltykov.diploma.editor.messages;

import lombok.Builder;
import lombok.Data;
import lombok.extern.jackson.Jacksonized;

@Data
@Builder
@Jacksonized
public class CursorUpdate {
    String user;
    String position;
    String rev;
}
