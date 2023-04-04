package ru.saltykov.diploma.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.access.InMemoryAccessPoint;

@Configuration
public class AccessPointConfig {
    @Bean
    AccessPoint getAccessPoint(){
        return new InMemoryAccessPoint();
    }
}
