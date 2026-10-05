package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminContactOtpVerifyRequest(
    @NotBlank(message = "Contact type is required (EMAIL or PHONE)")
    String contactType,

    @NotBlank(message = "OTP code is required")
    String otpCode
) {
}
