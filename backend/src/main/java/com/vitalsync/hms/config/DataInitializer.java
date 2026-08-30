package com.vitalsync.hms.config;

import com.vitalsync.hms.entity.User;
import com.vitalsync.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            // Ensure BCrypt password encoding for standard demo accounts
            if (!user.getPassword().startsWith("$2a$") || user.getPassword().length() < 20) {
                user.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(user);
            } else {
                // Re-encode to ensure perfect match with the current encoder
                user.setPassword(passwordEncoder.encode("password123"));
                userRepository.save(user);
            }
        }
    }
}
