package ru.saltykov.diploma.controllers;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Controller;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import ru.saltykov.diploma.domain.CollabUser;
import ru.saltykov.diploma.services.UserService;

import java.io.IOException;

@Controller
public class RegistrationController {
    @Autowired
    UserService userService;

    @RequestMapping(value = "/login")
    public String login(HttpServletRequest request, HttpServletResponse response, CsrfToken csrfToken) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth.isAuthenticated() && !((String)auth.getPrincipal()).equals("anonymousUser")){
            if (request.getParameter("redirect") != null)
                return "redirect:" + request.getParameter("redirect");
            else
                return "redirect:/";
        }
        else {
            response.setHeader("CSRF-Token", csrfToken.getToken());
            return "login";
        }
    }

    @RequestMapping(value = "/registration")
    public String register(HttpServletRequest request, HttpServletResponse response, CsrfToken csrfToken) throws IOException {
        response.setHeader("CSRF-Token", csrfToken.getToken());
        return "register";
    }

    @PostMapping("/registration")
    public String addUser(HttpServletRequest request, @RequestBody MultiValueMap<String, String> formData) throws ServletException {
        String username = formData.getFirst("username");
        String displayName = formData.getFirst("name");
        String password = formData.getFirst("password");
        CollabUser user = userService.addUser(username, displayName, password);
        if (user != null){
            request.login(username, password);
            if (request.getParameter("redirect") != null)
                return "redirect:" + request.getParameter("redirect");
            else
                return "redirect:/";
        }
        return "register";
    }
}
