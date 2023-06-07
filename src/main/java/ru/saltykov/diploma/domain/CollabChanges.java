package ru.saltykov.diploma.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollabChanges {
    private UUID id;
    private UUID file;
    private UUID user;
    private Integer revision;
    private String changesstring;
}
