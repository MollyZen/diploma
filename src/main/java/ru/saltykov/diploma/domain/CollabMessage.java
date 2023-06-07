package ru.saltykov.diploma.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CollabMessage {
    UUID id;
    UUID file;
    UUID user;
    Long timestamp;
    Integer messageid;
    String message;
}
