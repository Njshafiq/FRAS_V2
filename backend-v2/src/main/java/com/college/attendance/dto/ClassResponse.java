package com.college.attendance.dto;

import java.time.LocalDateTime;

public record ClassResponse(
    Long id,
    String className,
    String classCode,
    Long academicYearId,
    Long departmentId,
    Integer yearLevel,
    String section,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
