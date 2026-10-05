package com.college.attendance.dto;

import java.time.LocalDateTime;

public record AttendanceRecordResponse(
    Long id,
    Long sessionId,
    String studentId,
    String status,
    Double confidenceScore,
    String markedByTeacherId,
    LocalDateTime markedAt
) {
}
