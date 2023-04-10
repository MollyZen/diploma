package ru.saltykov.diploma.editing;

import lombok.Data;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.List;
import java.util.stream.Collectors;

@Data
public class ParsedChanges {
    private String user;
    private Long revision;
    private Long start;
    private Long length;
    private List<FormattedToken> tokens;
    private List<FormattedToken> negatedTokens;
    private String text;

    public DocumentChange toDocumentChange(){
        DocumentChange res = new DocumentChange();
        res.setUser(this.user);
        res.setRevision(this.revision);
        res.setChanges(tokens.stream().map(e -> e.getToken() + e.getValue()).collect(Collectors.joining(" ")));
        return res;
    }

    public Long getCharLengthChange() {
        return tokens.stream()
                .filter(e -> e.getToken().equals(AllowedTokens.CHAR_ADDED) || e.getToken().equals(AllowedTokens.CHAR_REMOVED))
                .mapToLong(e -> {
                    if (e.getToken().equals(AllowedTokens.CHAR_REMOVED))
                        return e.getValue() * -1;
                    else return e.getValue();
                })
                .sum();
    }
}
