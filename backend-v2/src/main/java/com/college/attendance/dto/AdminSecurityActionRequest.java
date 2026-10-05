package com.college.attendance.dto;

public record AdminSecurityActionRequest(
    String verificationType, // "PASSWORD" or "OTP" or "BOTH"
    String password,
    String otpCode
) {
}
