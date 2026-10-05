package com.college.attendance.dto;

public record SubjectAttendanceSummary(
    Long subjectId,
    String subjectCode,
    String subjectName,
    Integer semester,
    int totalClasses,
    int present,
    int absent,
    int late,
    double attendancePercentage
) {
}
