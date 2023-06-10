package ru.saltykov.diploma.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.domain.FileDescription;
import ru.saltykov.diploma.storage.DataStorage;

import java.util.UUID;

@RestController
@RequestMapping("/file")
public class FileController {

    @Autowired
    AccessPoint accessPoint;

    @Autowired
    DataStorage dataStorage;

    @PostMapping
    public FileDescription createFile(UUID owner) throws Exception{
        return dataStorage.createFile(owner);
    }

    @GetMapping
    public void getFile(){

    }

    @PutMapping
    public void modifyFile(){

    }

    @PatchMapping
    public void patchFile(){

    }

    @DeleteMapping
    public void deleteFile(){

    }
}
