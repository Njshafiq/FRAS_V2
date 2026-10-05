package com.college.attendance.dto;

import java.time.LocalDateTime;

public record CurriculumResponse(
    Long id,
    String regulation,
    Long departmentId,
    String departmentCode,
    String departmentName,
    Integer semester,
    Long subjectId,
    String subjectCode,
    String subjectName,
    Integer credits,
    String courseType,
    Long academicYearId,
    String academicYearName,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
