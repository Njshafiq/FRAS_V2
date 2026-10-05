package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
    @NotBlank(message = "Username or email is required") String identifier
) {
}
