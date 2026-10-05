package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AcademicYearRequest(
    @NotBlank String yearName,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    boolean active
) {
}
