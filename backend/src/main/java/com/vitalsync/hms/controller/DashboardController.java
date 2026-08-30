package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.DashboardStatsDto;
import com.vitalsync.hms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats(Authentication authentication) {
        DashboardStatsDto stats = dashboardService.getStats(authentication);
        return ResponseEntity.ok(stats);
    }
}
