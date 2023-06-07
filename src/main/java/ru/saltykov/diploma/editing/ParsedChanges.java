package ru.saltykov.diploma.editing;

import lombok.Data;
import org.springframework.data.util.Pair;
import ru.saltykov.diploma.messages.DocumentChange;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ParsedChanges {
    private String user;
    private Integer revision;
    private Integer start;
    private Integer length;
    private List<FormattedToken> tokens;
    private String text;

    public DocumentChange toDocumentChange(){
        DocumentChange res = new DocumentChange();
        res.setUser(this.user);
        res.setRevision(this.revision);
        res.setChanges(start.toString() + String.format("%+d", length) +
                "#" + tokens.stream().map(e -> e.getToken() + (e.getSubValue() != null ? e.getValue() + ":" + e.getSubValue() : e.getValue())).collect(Collectors.joining("")) +
                "#" + text);
        return res;
    }

    public Integer getCharLengthChange() {
        return tokens.stream()
                .filter(e -> e.getToken().equals(AllowedTokens.CHAR_ADDED) || e.getToken().equals(AllowedTokens.CHAR_REMOVED))
                .mapToInt(e -> {
                    if (e.getToken().equals(AllowedTokens.CHAR_REMOVED))
                        return e.getValue() * -1;
                    else return e.getValue();
                })
                .sum();
    }

    public List<Pair<FormattedToken, List<FormattedToken>>> getGroupedTokens() {
        List<Pair<FormattedToken, List<FormattedToken>>>res = new ArrayList<>();
        List<FormattedToken> formatting = new ArrayList<>();
        for (FormattedToken token : tokens) {
            if (!token.getToken().equals(AllowedTokens.APPLY_FORMATTING)){
                res.add(Pair.of(token, formatting));
                formatting = new ArrayList<>();
            }
            else
                formatting.add(token);
        }
        return res;
    }
}
