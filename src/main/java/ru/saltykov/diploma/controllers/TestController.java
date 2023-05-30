package ru.saltykov.diploma.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.editing.Transformer;
import ru.saltykov.diploma.messages.CollaborationMessageWrapper;
import ru.saltykov.diploma.messages.DocumentChange;
import ru.saltykov.diploma.messages.StatusUpdate;
import ru.saltykov.diploma.storage.DataStorage;

import java.security.Principal;
import java.util.*;

@Controller
public class TestController {

    private final SimpMessagingTemplate template;
    private final AccessPoint accessPoint;
    private final DataStorage dataStorage;

    private final Map<String, Transformer> transformers = new TreeMap<>();
    private final Map<String, Transformer> userSessions = new TreeMap<>();
    @Autowired
    public TestController(SimpMessagingTemplate template, AccessPoint accessPoint, DataStorage dataStorage) {
        this.template = template;
        this.accessPoint = accessPoint;
        this.dataStorage = dataStorage;
    }

    @MessageMapping("/session/{docId}")
    public void greeting(Message<?> message, Principal principal, @DestinationVariable("docId") String docId, @Payload CollaborationMessageWrapper payloadJson/*, @Payload String payload*/) throws Exception {
        String type = payloadJson.getType();
        Transformer transformer = transformers.get(docId);
        Set<Principal> users = transformer.getUsers();
        switch (type){
            case  "CHAT" : break;
            case  "CURSOR" : break;
            case  "CHANGES" : {
                DocumentChange change;
                try {
                    change = processChanges(transformer, principal, payloadJson);
                }catch (Exception ignored){
                    template.convertAndSendToUser(principal.getName(),
                            "/queue/session/" + docId,
                            "DENIED",
                            Collections.singletonMap("message-id", extractMessageId(message)));
                    System.out.println("MESSAGE " + message.toString() + " DENIED");
                    return;
                }
                String json = documentChangeToJson(change);
                for (Principal user : users) {
                    template.convertAndSendToUser(user.getName(),
                            "/queue/session/" + docId,
                            json,
                            Collections.singletonMap("message-id", extractMessageId(message)));
                }
            }
            case "STATUS" : break;
        }
    }

    private DocumentChange processChanges(Transformer transformer, Principal principal, CollaborationMessageWrapper payloadJson){
        DocumentChange payload = ((DocumentChange)payloadJson.getMessage());
        DocumentChange change = new DocumentChange();
        change.setUser(principal.getName());
        change.setChanges(payload.getChanges());
        change.setRevision(payload.getRevision());
        return transformer.applyChanges(change);
    }

    private String documentChangeToJson(DocumentChange change) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        CollaborationMessageWrapper wrapper = new CollaborationMessageWrapper();
        wrapper.setType("CHANGES");
        wrapper.setMessage(change);
        return mapper.writeValueAsString(wrapper);
    }

    private String statusUpdateToJson(StatusUpdate update) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        CollaborationMessageWrapper wrapper = new CollaborationMessageWrapper();
        wrapper.setType("STATUS");
        wrapper.setMessage(update);
        return mapper.writeValueAsString(wrapper);
    }

    private String extractMessageId(Message<?> message){
        return ((List<?>)message.getHeaders()
                .get("nativeHeaders", Map.class)
                .get("message-id"))
                .get(0).toString();
    }

    private String extractRev(Message<?> message){
        return ((List<?>)message.getHeaders()
                .get("nativeHeaders", Map.class)
                .get("rev"))
                .get(0).toString();
    }

    @EventListener
    public void onApplicationEvent(SessionConnectEvent event) {
        System.out.println("connected");
    }

    @EventListener
    public void onApplicationEvent(SessionSubscribeEvent event) throws JsonProcessingException {
        String destination = ((List<?>)event.getMessage().getHeaders().get("nativeHeaders", Map.class).get("destination")).get(0).toString();
        String[] split = destination.split("/");
        String fileId = split[split.length - 1];
        Transformer transformer = transformers.get(fileId);
        if (transformer == null) {
            transformer = new Transformer(accessPoint, dataStorage, fileId);
            transformers.put(fileId, transformer);
        }
        if (!transformer.getUsers().contains(event.getUser()))
            for (Principal user : transformer.getUsers())
                template.convertAndSendToUser(user.getName(),
                        "/queue/session/" + transformer.getFileId(),
                        statusUpdateToJson(StatusUpdate.builder().user(event.getUser().getName()).status("CONNECTED").build()));
        transformer.addUser(event.getUser());
        userSessions.put(event.getMessage().getHeaders().get("simpSessionId", String.class), transformer);
        System.out.println("subscribed");
    }

    @EventListener
    public void onApplicationEvent(SessionDisconnectEvent event) throws JsonProcessingException {
        Transformer sessionTransformer = userSessions.get(event.getMessage().getHeaders().get("simpSessionId", String.class));
        sessionTransformer.removeUser(event.getUser());
        if (!sessionTransformer.getUsers().contains(event.getUser()))
            for (Principal user : sessionTransformer.getUsers())
                template.convertAndSendToUser(user.getName(),
                        "/queue/session/" + sessionTransformer.getFileId(),
                        statusUpdateToJson(StatusUpdate.builder().user(event.getUser().getName()).status("DISCONNECTED").build()));

        System.out.println("disconnected");
    }
}
