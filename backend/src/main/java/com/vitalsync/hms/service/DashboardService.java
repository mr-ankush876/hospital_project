package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.DashboardStatsDto;
import org.springframework.security.core.Authentication;

public interface DashboardService {
    DashboardStatsDto getStats(Authentication authentication);
}
