package ru.saltykov.diploma.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.LogoutConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.context.SecurityContextPersistenceFilter;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.saltykov.diploma.domain.CollabUser;
import ru.saltykov.diploma.services.UserService;

import java.io.IOException;
import java.util.regex.Pattern;

@Configuration
public class SecurityConfig{
    @Autowired
    UserService userService;
    @Autowired
    RequestAuthenticationFilter myFilter;
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
                        .requestMatchers("/h2-console**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/login").permitAll()
                        .requestMatchers("/registration").permitAll()
                        /*.requestMatchers("/gs-guide-websocket/**").authenticated()
                        .requestMatchers("/user/**").authenticated()
                        .requestMatchers("/session/**").access()*/
                        .requestMatchers("/").permitAll()
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
                .logoutUrl("/logout")
                .and()
                .addFilterAfter(myFilter, SecurityContextPersistenceFilter.class);
        return http.build();
    }

    @Bean
    public Filter myFilter() {
        return new RequestAuthenticationFilter();
    }

    @Component
    public static class RequestAuthenticationFilter extends OncePerRequestFilter {
        @Autowired
        UserService userService;

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
            HttpSession session = request.getSession(false);

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (session != null && auth != null && !auth.getPrincipal().equals("anonymousUser") && auth instanceof CollabUser){
                if (userService.getUserByUsername(((CollabUser)auth.getPrincipal()).getUsername()) == null){
                    session.invalidate();
                    Cookie cookie = new Cookie("JSESSIONID", null);
                    cookie.setPath("/");
                    cookie.setHttpOnly(true);
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                }
            }
            filterChain.doFilter(request, response);
        }

        @Override
        protected boolean shouldNotFilter(HttpServletRequest request) {
            String path = request.getServletPath();
            return path.startsWith("/static/") || path.startsWith("/registration") || path.startsWith("/h2-console");
        }
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return userService;
    }

    @Bean
    @Autowired
    public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider auth = new DaoAuthenticationProvider();
        auth.setUserDetailsService(userService);
        auth.setPasswordEncoder(passwordEncoder);
        return auth;
    }

    public static class RedirectAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
        public RedirectAuthenticationSuccessHandler() {
            super();
            setTargetUrlParameter("redirect");   // if you want to use query param
        }
    }
}
