package ru.saltykov.diploma.controllers;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;
import ru.saltykov.diploma.rest.FileController;
import ru.saltykov.diploma.storage.FileDescription;

import java.io.IOException;

@Controller
@RequestMapping("/")
public class FilePickerController {
    @Autowired
    FileController fileController;

    @RequestMapping(value = "/")
    public RedirectView method(HttpServletResponse httpServletResponse) {
        return new RedirectView("/file-picker");
    }

    @GetMapping("/new-file")
    public RedirectView newFile(RedirectAttributes attributes) throws Exception{
        FileDescription desc = fileController.createFile();
        return new RedirectView("/file/" + desc.id() + "/edit");
    }

    @RequestMapping(value = "/file-picker")
    public String pickFile() throws IOException {
        return "file-picker";
    }

    @RequestMapping(value = "/file/{id}/edit")
    public String editFile() throws IOException {
        return "editor";
    }
}
