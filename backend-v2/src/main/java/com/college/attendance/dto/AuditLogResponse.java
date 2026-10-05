package com.college.attendance.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
    Long id,
    Long sessionId,
    String studentId,
    String previousStatus,
    String newStatus,
    String modifiedBy,
    String modificationType,
    String remarks,
    LocalDateTime logTimestamp
) {
}
