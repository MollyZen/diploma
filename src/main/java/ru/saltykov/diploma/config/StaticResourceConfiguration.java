package ru.saltykov.diploma.config;

import org.springframework.boot.system.ApplicationHome;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.view.InternalResourceViewResolver;
import ru.saltykov.diploma.DiplomaApplication;

import java.io.File;

@Configuration
public class StaticResourceConfiguration implements WebMvcConfigurer {

    private static final String[] CLASSPATH_RESOURCE_LOCATIONS = {
            "classpath:/META-INF/resources/", "classpath:/resources/",
            "classpath:/static/", "classpath:/public/" };

    public static ApplicationHome home = new ApplicationHome(DiplomaApplication.class);
    public static String homeDir = home.getDir().toString();

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Case when not packaged in jar
        if (homeDir.endsWith(File.separator + "classes"))
            homeDir = homeDir.replaceAll( "classes$", "");

        String tmp = homeDir + "static" + File.separator;
        tmp = tmp.replace(File.separator, "/");
        String staticContentPath = "file:/" + (!File.separator.equals("/") ? "//" : "") + tmp;

        registry.addResourceHandler("/**")
                .addResourceLocations(CLASSPATH_RESOURCE_LOCATIONS);
        registry.addResourceHandler("/static/**")
                .addResourceLocations(staticContentPath)
                .setCachePeriod(3600)
                .resourceChain(true);

        registry.addResourceHandler("/webjars/**").addResourceLocations("/webjars/").resourceChain(false);
    }

    @Bean
    public InternalResourceViewResolver internalResourceViewResolver() {
        InternalResourceViewResolver internalResourceViewResolver = new InternalResourceViewResolver();
        internalResourceViewResolver.setPrefix("/static/");
        internalResourceViewResolver.setSuffix(".html");
        return internalResourceViewResolver;
    }
}