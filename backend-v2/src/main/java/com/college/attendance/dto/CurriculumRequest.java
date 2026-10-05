package com.college.attendance.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CurriculumRequest(
    @NotBlank(message = "Regulation is required (e.g. R2021)")
    String regulation,

    @NotNull(message = "Department ID is required")
    Long departmentId,

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    Integer semester,

    @NotNull(message = "Subject ID is required")
    Long subjectId,

    @NotNull(message = "Credits are required")
    @Min(value = 0, message = "Credits cannot be negative")
    Integer credits,

    @NotBlank(message = "Course type is required (e.g. THEORY, LAB, CORE, ELECTIVE)")
    String courseType,

    Long academicYearId,
    Boolean active
) {
}
