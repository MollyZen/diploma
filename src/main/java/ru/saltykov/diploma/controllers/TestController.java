package ru.saltykov.diploma.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.*;

@Controller
public class TestController {

    private SimpMessagingTemplate template;
    @Autowired
    public TestController(SimpMessagingTemplate template) {
        this.template = template;
    }

    @MessageMapping("/session/{docId}")
    public void greeting(Message<?> message, Principal principal, @DestinationVariable("docId") String docId) throws Exception {
        template.convertAndSendToUser(principal.getName(),
                "/queue/session/" + docId,
                "SUCHARA LOL",
                Collections.singletonMap("message-id", extractMessageId(message)));
    }

    private String extractMessageId(Message<?> message){
        return ((List<?>)message.getHeaders()
                .get("nativeHeaders", Map.class)
                .get("message-id"))
                .get(0).toString();
    }
}
