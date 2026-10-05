package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TeacherClassAssignmentRequest(
    @NotBlank String teacherId,
    @NotNull Long classId,
    boolean active
) {
}
