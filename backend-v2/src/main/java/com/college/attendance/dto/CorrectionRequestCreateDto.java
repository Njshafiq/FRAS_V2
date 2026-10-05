package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CorrectionRequestCreateDto(
    @NotNull Long sessionId,
    @NotBlank String studentId,
    @NotBlank String requestedStatus,
    @NotBlank String reason
) {
}
