package ru.saltykov.diploma.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CollabStatus {
    UUID file;
    UUID user;
    String status;
    String value;
}
