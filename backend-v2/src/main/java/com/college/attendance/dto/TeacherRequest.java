package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record TeacherRequest(
    @NotBlank String teacherId,
    @NotBlank String name,
    @NotNull Long departmentId,
    String email,
    LocalDate hireDate,
    boolean active
) {
}
