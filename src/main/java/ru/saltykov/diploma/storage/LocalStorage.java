package ru.saltykov.diploma.storage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.saltykov.diploma.config.StaticResourceConfiguration;
import ru.saltykov.diploma.domain.FileDescription;
import ru.saltykov.diploma.repositories.FileDescriptionRepository;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Component
public class LocalStorage implements DataStorage{
    @Autowired
    FileDescriptionRepository fileDescriptionRepository;

    public static String path = StaticResourceConfiguration.homeDir + File.separator + "files";

    final HashMap<UUID, File> files = new HashMap<>();

    public LocalStorage() throws IOException{
        createFolderChmod(path);
        Path pathPath = Paths.get(path);
        Files.walkFileTree(pathPath, new SimpleFileVisitor<Path>(){
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                String fileName = file.toFile().getName();
                if (fileName.toUpperCase().endsWith(".COLLAB")) {
                    files.put(UUID.randomUUID(), file.toFile());
                }
                return FileVisitResult.CONTINUE;
            }
        });
    }

    @Override
    public FileDescription createFile(UUID owner) throws IOException {
        FileDescription description = new FileDescription();
        description.owner(owner);
        description.name("Новый Файл");
        fileDescriptionRepository.createFile(description);
        description = fileDescriptionRepository.getFile(description.id());
        File file = new File(path + File.separator + description.id() + ".collab");
        file.createNewFile();
        return description;
    }

    @Override
    public void updateFile(UUID fileId, String data) {

    }

    @Override
    public InputStream getFile(String filePath) {
        return null;
    }

    @Override
    public List<FileDescription> getFiles(UUID owner) {
        return null;
    }

    /**
     * Создание каталога, если не существует.
     * Выдача прав на запись, чтение, выполнение
     */
    @SuppressWarnings("all")
    public static void createFolderChmod(String path) {
        File folder = new File(path);
        if (!folder.exists()) {
            folder.mkdirs();
        }
        folder.setReadable(true);
        folder.setWritable(true);
        folder.setExecutable(true);
    }
}
