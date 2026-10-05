package com.college.attendance.dto;

import java.time.LocalDateTime;

public record TeacherSubjectAssignmentResponse(
    Long id,
    String teacherId,
    String teacherName,
    Long subjectId,
    String subjectName,
    String subjectCode,
    Integer credits,
    Long classId,
    String className,
    String classCode,
    Long departmentId,
    String departmentName,
    String departmentCode,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public TeacherSubjectAssignmentResponse(
        Long id,
        String teacherId,
        Long subjectId,
        String subjectName,
        String subjectCode,
        Integer credits,
        Long classId,
        String className,
        String classCode,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
        this(id, teacherId, null, subjectId, subjectName, subjectCode, credits, classId, className, classCode, null, null, null, active, createdAt, updatedAt);
    }

    public TeacherSubjectAssignmentResponse(
        Long id,
        String teacherId,
        Long subjectId,
        Long classId,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {
        this(id, teacherId, null, subjectId, null, null, null, classId, null, null, null, null, null, active, createdAt, updatedAt);
    }
}
