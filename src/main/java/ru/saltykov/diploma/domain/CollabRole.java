package ru.saltykov.diploma.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CollabRole implements GrantedAuthority {
    private Long id;
    private String name;
    @Override
    public String getAuthority() {
        return getName();
    }
}
