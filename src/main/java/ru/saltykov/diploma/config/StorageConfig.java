package ru.saltykov.diploma.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ru.saltykov.diploma.storage.DataStorage;
import ru.saltykov.diploma.storage.LocalStorage;

@Configuration
public class StorageConfig {
    @Bean
    DataStorage getDataStorage() throws Exception{
        return new LocalStorage();
    }
}
