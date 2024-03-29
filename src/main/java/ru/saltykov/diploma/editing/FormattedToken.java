package ru.saltykov.diploma.editing;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FormattedToken {
    private String token;
    private Integer value;
    private String subValue;
}
