package com.college.attendance.dto;

public record MonthlyAttendanceSummary(
    int year,
    int month,
    String monthName,
    int totalClasses,
    int present,
    int absent,
    int late,
    double monthlyPercentage
) {
}
