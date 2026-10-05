package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClassRequest(
    @NotBlank String className,
    @NotBlank String classCode,
    @NotNull Long academicYearId,
    @NotNull Long departmentId,
    @NotNull Integer yearLevel,
    String section,
    boolean active
) {
}
