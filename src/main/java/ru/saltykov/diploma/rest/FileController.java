package ru.saltykov.diploma.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.storage.DataStorage;
import ru.saltykov.diploma.storage.FileDescription;

@RestController
@RequestMapping("/file")
public class FileController {

    @Autowired
    AccessPoint accessPoint;

    @Autowired
    DataStorage dataStorage;

    @PostMapping
    public FileDescription createFile() throws Exception{
        return dataStorage.createFile();
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
