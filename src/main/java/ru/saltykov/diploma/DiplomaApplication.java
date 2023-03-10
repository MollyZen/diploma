package ru.saltykov.diploma;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;

@SpringBootApplication(exclude = RedisAutoConfiguration.class)
public class DiplomaApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiplomaApplication.class, args);
    }

}
