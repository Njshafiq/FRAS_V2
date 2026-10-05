package com.college.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TeacherResponse(String teacherId, String name, Long departmentId, String email, LocalDate hireDate,
                             boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
}
