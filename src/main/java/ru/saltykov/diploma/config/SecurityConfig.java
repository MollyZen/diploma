package ru.saltykov.diploma.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.LogoutConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.regex.Pattern;

@Configuration
public class SecurityConfig{
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf().requireCsrfProtectionMatcher(new RequestMatcher() {
            private Pattern allowedMethods = Pattern.compile("^(GET|HEAD|TRACE|OPTIONS)$");
            private RegexRequestMatcher apiMatcher = new RegexRequestMatcher("/h2-console.*", null);

            @Override
            public boolean matches(HttpServletRequest request) {
                // No CSRF due to allowedMethod
                if(allowedMethods.matcher(request.getMethod()).matches())
                    return false;

                // No CSRF due to api call
                if(apiMatcher.matches(request))
                    return false;

                // CSRF for everything else that is not an API call or an allowedMethod
                return true;
            }
        });
                //.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
        http.headers().frameOptions().sameOrigin()
                .and()
                .formLogin(Customizer.withDefaults())
                .logout(LogoutConfigurer::permitAll)
                .authorizeHttpRequests((requests) -> requests
                        .requestMatchers("/h2-console").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/login").permitAll()
                        /*.requestMatchers("/gs-guide-websocket/**").authenticated()
                        .requestMatchers("/user/**").authenticated()
                        .requestMatchers("/session/**").access()*/
                        .requestMatchers("/").authenticated()
                        .requestMatchers("/**").permitAll()
                        .requestMatchers("/logout").authenticated()
                        .anyRequest().authenticated()
                )
                .formLogin()
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .successHandler(new RedirectAuthenticationSuccessHandler())
                .and()
                .logout()
                .logoutUrl("/logout");

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails user1 =
                User.withDefaultPasswordEncoder()
                        .username("user")
                        .password("password")
                        .roles("USER")
                        .build();
        UserDetails user2 =
                User.withDefaultPasswordEncoder()
                        .username("user2")
                        .password("password")
                        .roles("USER")
                        .build();

        return new InMemoryUserDetailsManager(user1, user2);
    }

    public static class RedirectAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
        public RedirectAuthenticationSuccessHandler() {
            super();
            setTargetUrlParameter("redirect");   // if you want to use query param
        }
    }
}
