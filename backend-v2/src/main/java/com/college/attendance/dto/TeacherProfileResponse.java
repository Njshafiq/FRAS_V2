package com.college.attendance.dto;

import java.time.LocalDate;

public record TeacherProfileResponse(
    String teacherId,
    String name,
    String email,
    String departmentName,
    Long departmentId,
    LocalDate hireDate,
    boolean active
) {
}
