package ru.saltykov.diploma.rest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.domain.FileDescription;
import ru.saltykov.diploma.storage.DataStorage;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("")
public class FileController {

    @Autowired
    AccessPoint accessPoint;

    @Autowired
    DataStorage dataStorage;

    @PostMapping("/file")
    public FileDescription createFile(UUID owner) throws Exception{
        return dataStorage.createFile(owner);
    }

    @GetMapping("/file/{id}")
    public void getFile(Principal principal, @PathVariable String id){

    }

    @GetMapping("/files")
    public List<FileDescription> getFiles(Principal principal){
        return Collections.emptyList();
    }

    @DeleteMapping("/file/{id}")
    public void deleteFile(){

    }
}
