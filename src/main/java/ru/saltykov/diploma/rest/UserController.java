package ru.saltykov.diploma.rest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/rest")
public class UserController {
    @GetMapping(value = "/generate-id", produces = "text/plain")
    public String generateId(){
        return UUID.randomUUID().toString();
    }

    @GetMapping(value = "/getUsername", produces = "text/plain")
    public String getUsername(Principal principal) {
        return principal.getName();
    }
}
