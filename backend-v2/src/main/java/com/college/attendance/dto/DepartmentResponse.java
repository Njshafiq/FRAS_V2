package com.college.attendance.dto;

import java.time.LocalDateTime;

public record DepartmentResponse(Long id, String departmentCode, String name, boolean active,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {
}
