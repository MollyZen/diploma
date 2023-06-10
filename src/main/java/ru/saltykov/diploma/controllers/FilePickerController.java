package ru.saltykov.diploma.controllers;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.view.RedirectView;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.domain.CollabUser;
import ru.saltykov.diploma.domain.FileDescription;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.rest.FileController;

import java.io.IOException;
import java.security.Principal;

@Controller
@RequestMapping("/")
public class FilePickerController {
    @Autowired
    FileController fileController;
    @Autowired
    AccessPoint accessPoint;

    @RequestMapping(value = "/")
    public RedirectView method(HttpServletResponse httpServletResponse) {
        return new RedirectView("/file-picker");
    }

    @GetMapping("/new-file")
    public RedirectView newFile(Principal principal) throws Exception{
        UsernamePasswordAuthenticationToken auth = ((UsernamePasswordAuthenticationToken) principal);
        if (auth != null && auth.getPrincipal() != null) {
            FileDescription desc = fileController.createFile(((CollabUser)auth.getPrincipal()).getId());
            accessPoint.insertChanges(desc.id(), DocumentChange.builder().revision(0).changes("0+1#+1#\n").build());
            return new RedirectView("/file/" + desc.id() + "/edit");
        }
        else
            return new RedirectView("/");
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
