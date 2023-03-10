package ru.saltykov.diploma.storage;

import java.io.FileDescriptor;
import java.io.InputStream;
import java.util.List;

public interface DataStorage {
    public InputStream getFile();
    public List<FileDescriptor> getFiles();
}
