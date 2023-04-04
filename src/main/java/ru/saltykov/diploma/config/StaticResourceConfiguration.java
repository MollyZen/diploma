package ru.saltykov.diploma.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.View;
import org.springframework.web.servlet.ViewResolver;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.view.AbstractCachingViewResolver;
import org.springframework.web.servlet.view.InternalResourceViewResolver;
import org.springframework.web.util.pattern.PathPattern;
import ru.saltykov.diploma.DiplomaApplication;

import java.io.File;
import java.util.Locale;
import java.util.Map;

@Configuration
public class StaticResourceConfiguration implements WebMvcConfigurer {

    private static final String[] CLASSPATH_RESOURCE_LOCATIONS = {
            "classpath:/META-INF/resources/", "classpath:/resources/",
            "classpath:/static/", "classpath:/public/" };

    ApplicationHome home = new ApplicationHome(DiplomaApplication.class);
    String homeDir = home.getDir().toString();

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Case when not packaged in jar
        if (homeDir.endsWith(File.separator + "classes"))
            homeDir = homeDir.replaceAll( "classes$", "");

        String staticContentPath = "file:/" + homeDir + File.separator + "static" + File.separator;

        registry.addResourceHandler("/**")
                .addResourceLocations(CLASSPATH_RESOURCE_LOCATIONS);
        registry.addResourceHandler("/static/**")
                .addResourceLocations(staticContentPath/*,
                        staticContentPath + "js" + File.separator,
                        staticContentPath + "img" + File.separator,
                        staticContentPath + "css" + File.separator*/
                ).setCachePeriod(3600);

        registry.addResourceHandler("/webjars/**").addResourceLocations("/webjars/").resourceChain(false);
    }
}