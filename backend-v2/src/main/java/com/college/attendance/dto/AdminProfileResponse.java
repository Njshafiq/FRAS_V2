package com.college.attendance.dto;

import com.college.attendance.model.Role;

public record AdminProfileResponse(
    Long id,
    String username,
    String name,
    String email,
    String phone,
    Role role,
    boolean emailVerified,
    boolean phoneVerified
) {
}
