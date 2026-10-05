package com.college.attendance.dto;

import java.time.LocalDate;

public record AttendanceReportItem(
    String studentId,
    String studentName,
    String registerNumber,
    String className,
    String subjectCode,
    String subjectName,
    LocalDate sessionDate,
    String status,
    Double confidenceScore,
    String markedBy
) {
}
