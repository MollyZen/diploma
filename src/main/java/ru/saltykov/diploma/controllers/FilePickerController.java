package ru.saltykov.diploma.controllers;

import io.micrometer.core.instrument.util.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;
import ru.saltykov.diploma.rest.FileController;
import ru.saltykov.diploma.storage.FileDescription;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Controller
@RequestMapping("/")
public class FilePickerController {
    @Autowired
    FileController fileController;

    @GetMapping("/new-file")
    public RedirectView newFile(RedirectAttributes attributes) throws Exception{
        FileDescription desc = fileController.createFile();
        /*attributes.addFlashAttribute("flashAttribute", "redirectWithRedirectView");
        attributes.addAttribute("attribute", "redirectWithRedirectView");*/
        return new RedirectView("/file/" + desc.id() + "/edit");
    }

    @GetMapping(value = "/file-picker", produces = "text/html")
    @ResponseBody
    public String  pickFile() throws IOException {
        /*ModelAndView modelAndView = new ModelAndView();
        modelAndView.setViewName("static/file-picker.html");
        return modelAndView;*/
        return IOUtils.toString(Files.newInputStream(Path.of("C:\\Users\\MZ\\IdeaProjects\\diplomaNew\\src\\main\\resources\\static\\file-picker.html")));
    }

    @GetMapping(value = "/file/{id}/edit", produces = "text/html")
    @ResponseBody
    public String editFile() throws IOException {
        /*ModelAndView modelAndView = new ModelAndView();
        modelAndView.setViewName("");
        return modelAndView;*/
        return IOUtils.toString(Files.newInputStream(Path.of("C:\\Users\\MZ\\IdeaProjects\\diplomaNew\\src\\main\\resources\\static\\editor.html")));
    }
}
