package ru.saltykov.diploma.messages;

import lombok.Builder;
import lombok.Data;
import lombok.extern.jackson.Jacksonized;

@Data
public class DocumentChange {
    String user;
    String changes;
    Long revision;
}
