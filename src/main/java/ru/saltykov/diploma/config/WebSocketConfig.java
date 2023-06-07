package ru.saltykov.diploma.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private HandshakeHandlerConfig customHandshakeHandler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        ThreadPoolTaskScheduler te = new ThreadPoolTaskScheduler();
        te.setPoolSize(5);
        te.setThreadNamePrefix("wss-heartbeat-thread-");
        te.initialize();

        config.enableSimpleBroker("/queue").setTaskScheduler(te).setHeartbeatValue(new long[]{10000, 10000});
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/gs-guide-websocket")
                .setHandshakeHandler(customHandshakeHandler)
                .withSockJS();
    }

    @Component
    public static class HandshakeHandlerConfig extends DefaultHandshakeHandler {
        // Custom class for storing principal
        @Override
        protected Principal determineUser(ServerHttpRequest request,
                                          WebSocketHandler wsHandler,
                                          Map<String, Object> attributes) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return new StompPrincipal(UUID.randomUUID().toString(), authentication);
        }
    }
}
