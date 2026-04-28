package com.attendance.backend.config;

import com.attendance.backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/auth/**").permitAll()
                // Admin only
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/students/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/students/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/students/**").hasRole("ADMIN")
                .requestMatchers("/dashboard/**").hasAnyRole("ADMIN", "TEACHER")
                .requestMatchers(HttpMethod.POST, "/teachers/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/teachers/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/teachers/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/classes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/classes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/classes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/schedules/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/schedules/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/schedules/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/semesters/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/semesters/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/semesters/**").hasRole("ADMIN")
                // Authenticated for rest
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
