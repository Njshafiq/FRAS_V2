package com.college.attendance.dto;

import java.time.LocalDateTime;

public record OtpResponse(
    String identifier,
    String otpCode,
    String purpose,
    LocalDateTime expiresAt
) {
}
