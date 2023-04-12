package ru.saltykov.diploma.editing;

import org.junit.jupiter.api.Test;
import ru.saltykov.diploma.access.InMemoryAccessPoint;
import ru.saltykov.diploma.messages.DocumentChange;

import static org.junit.jupiter.api.Assertions.*;

class TransformerTest {
    @Test
    public void appendToEndTest(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange(null, "0+6#+6#FOOBAR", 0L);
        DocumentChange ch1 = new DocumentChange(null, "3+3#+3#BOB", 1L);
        DocumentChange ch2 = new DocumentChange(null, "0-3#-3#", 1L);
        transformer.applyChanges(src);
        transformer.insertText();
        transformer.applyChanges(ch1);
        transformer.insertText();
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("BOBBAR", accessPoint.getLastText().getSecond());
    }

}