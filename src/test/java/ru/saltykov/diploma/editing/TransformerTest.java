package ru.saltykov.diploma.editing;

import org.junit.jupiter.api.Test;
import ru.saltykov.diploma.access.InMemoryAccessPoint;
import ru.saltykov.diploma.messages.DocumentChange;

import static org.junit.jupiter.api.Assertions.*;

class TransformerTest {
    @Test
    public void appendToEndTest() {
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+6#+6#FOOBAR", 0L);
        DocumentChange ch1 = new DocumentChange("3+3#+3#BOB", 1L);
        DocumentChange ch2 = new DocumentChange("0-3#-3#", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("BOBBAR", accessPoint.getLastText().getSecond());
    }

    @Test
    public void deleteSamePartTwice() {
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+6#+6#FOOBAR", 0L);
        DocumentChange ch1 = new DocumentChange("1-3#-3#", 1L);
        DocumentChange ch2 = new DocumentChange("1-3#-3#", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("FAR", accessPoint.getLastText().getSecond());
    }

    @Test
    public void shiftInsert() {
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+6#+6#FOOBAR", 0L);
        DocumentChange ch1 = new DocumentChange("1-3#-3#", 1L);
        DocumentChange ch2 = new DocumentChange("5+1#+1#A", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("FAAR", accessPoint.getLastText().getSecond());
    }

    @Test
    public void multipleInsertsAtSamePosition() {
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+6#+6#FOOBAR", 0L);
        DocumentChange ch1 = new DocumentChange("1-3#-3#", 1L);
        DocumentChange ch2 = new DocumentChange("5+1#+1#A", 1L);
        DocumentChange ch3 = new DocumentChange("5+1#+1#B", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.applyChanges(ch3);
        transformer.insertText();
        assertEquals("FAABR", accessPoint.getLastText().getSecond());
    }

    @Test
    public void doubleReplace(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+3#+3#AAA", 0L);
        DocumentChange ch1 = new DocumentChange("0+0#-1+1#B", 1L);
        DocumentChange ch2 = new DocumentChange("0+0#-1+1#C", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("BCAA", accessPoint.getLastText().getSecond());
    }

}