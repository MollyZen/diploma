package ru.saltykov.diploma.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.access.H2AccessPoint;
import ru.saltykov.diploma.access.InMemoryAccessPoint;

@Configuration
public class AccessPointConfig {
    @Bean
    @Primary
    AccessPoint getAccessPoint(){
        return new H2AccessPoint();
    }
}
