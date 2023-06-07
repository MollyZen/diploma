package ru.saltykov.diploma.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.CurrentSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.saltykov.diploma.domain.CollabUser;
import ru.saltykov.diploma.domain.FileDescription;
import ru.saltykov.diploma.repositories.FileDescriptionRepository;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/rest")
public class UserController {
    @Autowired
    FileDescriptionRepository fileDescriptionRepository;

    @GetMapping(value = "/getUsername", produces = "text/plain")
    public String getUsername(@CurrentSecurityContext SecurityContext context, Principal principal) {
        if (principal != null)
            return principal.getName();
        else
            return "";
    }

    @GetMapping(value = "/getDisplayname", produces = "text/plain")
    public String getDisplayname(Principal principal) {
        UsernamePasswordAuthenticationToken auth = ((UsernamePasswordAuthenticationToken) principal);
        if (auth != null && auth.getPrincipal() != null)
            return ((CollabUser)auth.getPrincipal()).getDisplayname();
        else
            return "";
    }

    @GetMapping(value = "/getAvailableFiles", produces = "application/json")
    public List<FileDescription> getAvailableFiles(Principal principal){
        UsernamePasswordAuthenticationToken auth = ((UsernamePasswordAuthenticationToken) principal);
        if (auth != null && auth.getPrincipal() != null)
            return fileDescriptionRepository.getFilesAvailableToUser(((CollabUser)auth.getPrincipal()).getId());
        else
            return fileDescriptionRepository.getFilesAvailableToAll();
    }

    @GetMapping(value = "/fontCodes", produces = "application/json")
    public String getFontCodes() throws JsonProcessingException {
        Map<Integer, String> codes = new HashMap<>();
        codes.put(0, "Arial");
        codes.put(1, "Times New Roman");
        codes.put(2, "Calibri");
        codes.put(3, "Courier");

        ObjectMapper objectMapper = new ObjectMapper();
        return objectMapper.writeValueAsString(codes);
    }
}
