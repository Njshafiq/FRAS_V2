package com.college.attendance.dto;

import java.time.LocalDateTime;

public record CorrectionRequestResponse(
    Long id,
    Long sessionId,
    String studentId,
    String studentName,
    String teacherId,
    String currentStatus,
    String requestedStatus,
    String reason,
    String status,
    String adminRemarks,
    LocalDateTime reviewedAt,
    String reviewedBy,
    LocalDateTime createdAt
) {
}
