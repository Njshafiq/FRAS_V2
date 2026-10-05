package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;

public record DepartmentRequest(
    @NotBlank String departmentCode,
    @NotBlank String name,
    boolean active
) {
}
