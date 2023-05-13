package ru.saltykov.diploma.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
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

    @GetMapping(value = "/fontCodes", produces = "application/json")
    public String getFontCodes() throws JsonProcessingException {
        Map<Integer, String> codes = new HashMap<>();
        codes.put(0, "Arial");
        codes.put(1, "Times New Roman");
        codes.put(2, "Calibri");
        codes.put(3, "Roboto Mono");

        ObjectMapper objectMapper = new ObjectMapper();
        return objectMapper.writeValueAsString(codes);
    }
}
