package ru.saltykov.diploma.storage;

import ru.saltykov.diploma.config.StaticResourceConfiguration;

import java.io.File;
import java.io.FileDescriptor;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

public class LocalStorage implements DataStorage{

    public static String path = StaticResourceConfiguration.homeDir + "\\files";

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
    public FileDescription createFile() throws IOException {
        UUID uuid = UUID.randomUUID();
        File file = new File(path + File.separator + uuid + ".collab");
        file.createNewFile();
        files.put(uuid, file);
        LocalDateTime now = LocalDateTime.now();
        return new FileDescription().created(now).lastModified(now).id(uuid).name(uuid.toString() + ".collab");
    }

    @Override
    public void updateFile(String fileId, String data) {

    }

    @Override
    public InputStream getFile(String filePath) {
        return null;
    }

    @Override
    public List<FileDescriptor> getFiles(String user) {
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
