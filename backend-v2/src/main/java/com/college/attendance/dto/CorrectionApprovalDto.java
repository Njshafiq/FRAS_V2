package com.college.attendance.dto;

import jakarta.validation.constraints.NotNull;

public record CorrectionApprovalDto(
    @NotNull Boolean approve,
    String adminRemarks
) {
}
