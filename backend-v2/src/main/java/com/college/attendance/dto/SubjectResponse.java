package com.college.attendance.dto;

import java.time.LocalDateTime;

public record SubjectResponse(Long id, String subjectCode, String subjectName, Long departmentId,
                             Integer yearLevel, Integer semester, Integer credits, boolean active,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
}
