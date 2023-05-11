package ru.saltykov.diploma.messages;

import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
public class DocumentChange extends CollaborationMessage{
    String changes;
    Long revision;
}
