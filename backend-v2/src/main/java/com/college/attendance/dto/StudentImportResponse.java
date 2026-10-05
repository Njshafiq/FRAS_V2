package com.college.attendance.dto;

public record StudentImportResponse(
    int importedCount,
    int skippedCount,
    int totalRows,
    String message
) {
}
