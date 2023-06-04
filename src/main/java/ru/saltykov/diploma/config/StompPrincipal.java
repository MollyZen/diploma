package ru.saltykov.diploma.config;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.security.Principal;

@EqualsAndHashCode
public class StompPrincipal implements Principal {

    @Getter
    private final Principal corePrincipal;
    private final String name;

    public StompPrincipal(String name, Principal corePrincipal) {
        this.corePrincipal = corePrincipal;
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }
}