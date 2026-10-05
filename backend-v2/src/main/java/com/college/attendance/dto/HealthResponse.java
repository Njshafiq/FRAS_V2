package com.college.attendance.dto;

public record HealthResponse(
    String status,
    String message,
    String service,
    String version,
    String database,
    String databaseProduct,
    String databaseVersion
) {
}
