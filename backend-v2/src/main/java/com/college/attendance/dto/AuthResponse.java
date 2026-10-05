package com.college.attendance.dto;

public record AuthResponse(String token, String username, String name, String role) {
}
