package ru.saltykov.diploma.editing;

import lombok.Data;

@Data
public class ParsedChanges {
    String user;
    Long revision;

    Long start;
    Long length;
    FormattedToken[] tokens;
    String text;
}
