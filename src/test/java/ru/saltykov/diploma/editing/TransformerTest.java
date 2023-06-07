package ru.saltykov.diploma.editing;

import org.junit.jupiter.api.Test;
import ru.saltykov.diploma.access.InMemoryAccessPoint;
import ru.saltykov.diploma.messages.DocumentChange;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TransformerTest {
    @Test
    public void appendToEndTest() {
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+6#+6#FOOBAR", 0L);
        DocumentChange ch1 = new DocumentChange("3+3#+3#BOB", 1L);
        DocumentChange ch2 = new DocumentChange("0-3#-3#", 1L);
        transformer.applyChanges(src);
        transformer.insertText();
        transformer.applyChanges(ch1);
        transformer.insertText();
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("0+6#+6#BOBBAR", accessPoint.getLastText(transformer.getFileId()).getSecond());
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
        assertEquals("0+3#+3#FAR", accessPoint.getLastText(transformer.getFileId()).getSecond());
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
        assertEquals("0+4#+4#FAAR", accessPoint.getLastText(transformer.getFileId()).getSecond());
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
        assertEquals("0+5#+5#FAABR", accessPoint.getLastText(transformer.getFileId()).getSecond());
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
        assertEquals("0+4#+4#BCAA", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }

    @Test
    public void insanity(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+4#+4#AAAA", 0L);
        DocumentChange ch1 = new DocumentChange("0-2#-2#", 1L);
        DocumentChange ch2 = new DocumentChange("1-3#-3#", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("0+0##", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }

    @Test
    public void charRemovedCharAddedAtTheSamePosition(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+4#+4#ABCD", 0L);
        DocumentChange ch1 = new DocumentChange("1-1#-1#", 1L);
        DocumentChange ch2 = new DocumentChange("1+2#+2#BB", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("0+5#+5#ABBCD", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }

    @Test
    public void prevTestReversed(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+4#+4#ABCD", 0L);
        DocumentChange ch2 = new DocumentChange("1+2#+2#ZZ", 1L);
        DocumentChange ch1 = new DocumentChange("1-1#-1#", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch2);
        transformer.applyChanges(ch1);
        transformer.insertText();
        assertEquals("0+5#+5#AZZCD", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }

    @Test
    public void prevTestReversedAndHardened(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+4#+4#ABCD", 0L);
        DocumentChange ch2 = new DocumentChange("1+2#+2#ZZ", 1L);
        DocumentChange ch1 = new DocumentChange("1-1#-1+2#HH", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch2);
        transformer.applyChanges(ch1);
        transformer.insertText();
        assertEquals("0+7#+7#AZZHHCD", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }

    @Test
    public void prevTestReversedAndHardenedAndHardened(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+4#+4#ABCD", 0L);
        DocumentChange ch2 = new DocumentChange("0+1#-1+2#ZZ", 1L);
        DocumentChange ch1 = new DocumentChange("1-1#-1+2#HH", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch2);
        transformer.applyChanges(ch1);
        transformer.insertText();
        assertEquals("0+6#+6#ZZHHCD", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }

    @Test
    public void withKeeping(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+4#+4#ABCD", 0L);
        DocumentChange ch1 = new DocumentChange("1+0#=3#", 1L);
        DocumentChange ch2 = new DocumentChange("1-2#-2#", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("0+2#+2#AD", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }

    @Test
    public void lookup(){
        InMemoryAccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, null, "1");
        DocumentChange src = new DocumentChange("0+4#+4#ABCD", 0L);
        DocumentChange ch1 = new DocumentChange("2-1#-1-1+1#E", 1L);
        DocumentChange ch2 = new DocumentChange("2+1#+2=1#FD", 1L);
        transformer.applyChanges(src);
        transformer.applyChanges(ch1);
        transformer.applyChanges(ch2);
        transformer.insertText();
        assertEquals("0+5#+5#ABEFD", accessPoint.getLastText(transformer.getFileId()).getSecond());
    }
}