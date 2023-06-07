package ru.saltykov.diploma.storage;

import ru.saltykov.diploma.domain.FileDescription;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

public interface DataStorage {

    FileDescription createFile(UUID owner) throws IOException;
    void updateFile(UUID fileId, String data);
    InputStream getFile(String filePath);
    List<FileDescription> getFiles(UUID owner);
}
