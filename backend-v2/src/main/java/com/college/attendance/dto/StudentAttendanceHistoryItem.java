package com.college.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StudentAttendanceHistoryItem(
    Long recordId,
    Long sessionId,
    LocalDate sessionDate,
    String subjectCode,
    String subjectName,
    String className,
    String teacherName,
    String status,
    Double confidenceScore,
    LocalDateTime markedAt
) {
}
