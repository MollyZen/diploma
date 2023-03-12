package ru.saltykov.diploma.config;

import org.springframework.boot.system.ApplicationHome;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import ru.saltykov.diploma.DiplomaApplication;

import java.io.File;

@Configuration
public class StaticResourceConfiguration implements WebMvcConfigurer {

    private static final String[] CLASSPATH_RESOURCE_LOCATIONS = {
            "classpath:/META-INF/resources/", "classpath:/resources/",
            "classpath:/static/", "classpath:/public/" };

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        ApplicationHome home = new ApplicationHome(DiplomaApplication.class);
        String homeDir = home.getDir().toString();
        // Case when not packaged in jar
        if (homeDir.endsWith(File.separatorChar + "classes"))
            homeDir = homeDir.replaceAll( "classes$", "");
        String staticContentPath = "file:/" + homeDir + File.separatorChar + "static" + File.separatorChar;

        registry.addResourceHandler("/**")
                .addResourceLocations(CLASSPATH_RESOURCE_LOCATIONS);
        registry.addResourceHandler("/static/**")
                .addResourceLocations(staticContentPath)
                .setCachePeriod(3600);
                //.resourceChain(true)
                //.addResolver(new PathResourceResolver());
    }
}