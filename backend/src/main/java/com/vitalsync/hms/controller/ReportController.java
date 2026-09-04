package com.vitalsync.hms.controller;

import com.vitalsync.hms.dto.ReportSummaryDto;
import com.vitalsync.hms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDto> getSummary(@RequestParam(defaultValue = "30d") String range) {
        ReportSummaryDto summary = reportService.getSummary(range);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(@RequestParam(defaultValue = "30d") String range) {
        byte[] csvData = reportService.exportCsv(range);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"vitalsync-analytics-report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
