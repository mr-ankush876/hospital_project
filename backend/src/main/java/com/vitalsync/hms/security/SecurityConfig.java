package com.vitalsync.hms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitalsync.hms.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,https://hospital-project-omega-eight.vercel.app}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)) // H2 Console support
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Allow all CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public endpoints
                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/health/**", "/actuator/health/**").permitAll()
                        .requestMatchers("/api/search/**").permitAll()
                        .requestMatchers("/api/doctors/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/departments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/emergencies/contacts").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/emergencies").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/beds/stats").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()

                        // Auth session endpoints
                        .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()

                        // Patient Portal
                        .requestMatchers("/api/patient/**").hasAnyRole("PATIENT", "ADMIN", "RECEPTIONIST")

                        // Doctor Portal
                        .requestMatchers("/api/doctor/**").hasAnyRole("DOCTOR", "ADMIN", "RECEPTIONIST")

                        // Admin & Receptionist Management endpoints
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "RECEPTIONIST")

                        // Departments Governance
                        .requestMatchers("/api/departments/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")

                        // Bed & ICU Management
                        .requestMatchers("/api/beds/**").hasAnyRole("ADMIN", "RECEPTIONIST", "DOCTOR")

                        // Medical Reports
                        .requestMatchers("/api/medical-reports/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")

                        // Dashboard endpoints
                        .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")

                        // Doctors management
                        .requestMatchers("/api/doctors/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT")

                        // Patients management
                        .requestMatchers("/api/patients/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")

                        // Appointments
                        .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")

                        // Prescriptions
                        .requestMatchers("/api/prescriptions/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")

                        // Billing
                        .requestMatchers("/api/bills/**").hasAnyRole("ADMIN", "RECEPTIONIST")

                        // Reports Analytics
                        .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "RECEPTIONIST")

                        // Settings
                        .requestMatchers("/api/settings/**").authenticated()

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ErrorResponse err = ErrorResponse.builder()
                                    .timestamp(LocalDateTime.now())
                                    .status(HttpServletResponse.SC_UNAUTHORIZED)
                                    .error("Unauthorized")
                                    .message("Authentication token is missing, invalid, or expired")
                                    .path(request.getRequestURI())
                                    .build();
                            response.getOutputStream().write(objectMapper.writeValueAsBytes(err));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ErrorResponse err = ErrorResponse.builder()
                                    .timestamp(LocalDateTime.now())
                                    .status(HttpServletResponse.SC_FORBIDDEN)
                                    .error("Forbidden")
                                    .message("Access denied: You do not possess the required clinical authorization role")
                                    .path(request.getRequestURI())
                                    .build();
                            response.getOutputStream().write(objectMapper.writeValueAsBytes(err));
                        })
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        if (origins.contains("*")) {
            configuration.setAllowedOriginPatterns(List.of("*"));
        } else {
            configuration.setAllowedOrigins(origins);
            configuration.setAllowedOriginPatterns(List.of("*"));
        }

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
