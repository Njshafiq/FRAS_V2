package com.college.attendance.dto;

import java.time.LocalDateTime;

public record TeacherClassAssignmentResponse(
    Long id,
    String teacherId,
    Long classId,
    String className,
    String classCode,
    String section,
    Integer yearLevel,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public TeacherClassAssignmentResponse(Long id, String teacherId, Long classId, boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, teacherId, classId, null, null, null, null, active, createdAt, updatedAt);
    }
}
