package com.college.attendance.dto;

public record OverallAttendanceSummary(
    int totalClasses,
    int present,
    int absent,
    int late,
    double overallPercentage
) {
}
