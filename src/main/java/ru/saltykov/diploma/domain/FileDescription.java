package ru.saltykov.diploma.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Accessors(fluent = true, chain = true)
public class FileDescription {
    UUID id;
    UUID owner;
    Boolean sharable;
    String name;
    Long creationdate;
}
