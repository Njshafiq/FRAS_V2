package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record StudentRequest(
    @NotBlank String studentId,
    @NotBlank String name,
    @NotBlank String registerNumber,
    @NotNull Long classId,
    @NotNull Long academicYearId,
    String gender,
    String phone,
    String email,
    LocalDate dateOfBirth,
    LocalDate enrollmentDate,
    boolean active
) {
}
