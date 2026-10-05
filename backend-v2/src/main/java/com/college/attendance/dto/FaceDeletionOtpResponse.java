package com.college.attendance.dto;

import java.time.LocalDateTime;

public record FaceDeletionOtpResponse(
    String studentId,
    String otpCode,
    LocalDateTime expiresAt
) {
}
