package com.vitalsync.hms.service;

import com.vitalsync.hms.dto.ReportSummaryDto;

public interface ReportService {
    ReportSummaryDto getSummary(String range);
    byte[] exportCsv(String range);
}
