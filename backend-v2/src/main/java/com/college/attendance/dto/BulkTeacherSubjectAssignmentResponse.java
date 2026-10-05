package com.college.attendance.dto;

import java.util.List;

public record BulkTeacherSubjectAssignmentResponse(
    int added,
    int alreadyExisted,
    int failed,
    List<ClassAssignmentResult> results
) {
    public record ClassAssignmentResult(
        Long classId,
        String classCode,
        String className,
        String status, // "ADDED", "ALREADY_EXISTS", "FAILED"
        String message
    ) {}
}
