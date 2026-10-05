package com.college.attendance.dto;

import java.util.List;

public record BulkAcademicImportResponse(
    int totalRows,
    int successCount,
    int failedCount,
    List<SheetImportSummary> sheetSummaries,
    String message
) {
}
