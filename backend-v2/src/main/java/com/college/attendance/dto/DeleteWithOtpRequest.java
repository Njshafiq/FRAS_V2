package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteWithOtpRequest(
    @NotBlank String id,
    @NotBlank String otpCode
) {
}
