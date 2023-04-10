package ru.saltykov.diploma.editing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import ru.saltykov.diploma.access.AccessPoint;
import ru.saltykov.diploma.access.InMemoryAccessPoint;

import static org.junit.jupiter.api.Assertions.*;

class TransformerTest {
    @Test
    public void appendToEndTest(){
        AccessPoint accessPoint = new InMemoryAccessPoint();
        Transformer transformer = new Transformer(accessPoint, "1");
    }

}