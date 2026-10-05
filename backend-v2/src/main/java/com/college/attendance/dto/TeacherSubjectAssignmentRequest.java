package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TeacherSubjectAssignmentRequest(
    @NotBlank String teacherId,
    @NotNull Long subjectId,
    @NotNull Long classId,
    boolean active
) {
}
