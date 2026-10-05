package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;

public record SubjectRequest(
    @NotBlank String subjectCode,
    @NotBlank String subjectName,
    Long departmentId,
    Integer yearLevel,
    Integer semester,
    Integer credits,
    boolean active
) {
}
