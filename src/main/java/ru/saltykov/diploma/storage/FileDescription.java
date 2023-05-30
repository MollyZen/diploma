package ru.saltykov.diploma.storage;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

import java.io.File;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@Accessors(fluent = true, chain = true)
public class FileDescription {
    UUID id;
    String name;
    File preview;
    String owner;
    LocalDateTime lastModified;
    LocalDateTime created;
    String mimeType;
}
