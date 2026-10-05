package com.college.attendance.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BulkTeacherSubjectAssignmentRequest(
    @NotNull(message = "Teacher ID is required")
    String teacherId,

    @NotNull(message = "Subject ID is required")
    Long subjectId,

    @NotEmpty(message = "At least one class must be selected")
    List<Long> classIds,

    boolean active
) {
    public BulkTeacherSubjectAssignmentRequest(String teacherId, Long subjectId, List<Long> classIds) {
        this(teacherId, subjectId, classIds, true);
    }
}
