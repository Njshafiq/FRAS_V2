package com.college.attendance.dto;

import java.util.List;

public record SheetImportSummary(
    String sheetName,
    int totalRows,
    int successCount,
    int failedCount,
    List<RowFailure> failures
) {
}
