package ru.saltykov.diploma.storage;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public interface DataStorage {

    FileDescription createFile() throws IOException;
    void updateFile(String fileId, String data);
    InputStream getFile(String filePath);
    List<FileDescription> getFiles(String user);
}
