package com.vitalsync.hms.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;
    private final Environment environment;

    @Value("${spring.application.name:vitalsync-hms}")
    private String applicationName;

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("service", applicationName);
        health.put("timestamp", LocalDateTime.now());
        health.put("profiles", Arrays.asList(environment.getActiveProfiles()));

        boolean dbConnected = false;
        String dbType = "Unknown";
        try (Connection conn = dataSource.getConnection()) {
            dbConnected = conn.isValid(2);
            dbType = conn.getMetaData().getDatabaseProductName();
        } catch (Exception e) {
            dbConnected = false;
        }

        health.put("database", dbConnected ? "UP" : "DOWN");
        health.put("databaseType", dbType);
        health.put("status", dbConnected ? "UP" : "DEGRADED");

        return dbConnected ? ResponseEntity.ok(health) : ResponseEntity.status(503).body(health);
    }
}
