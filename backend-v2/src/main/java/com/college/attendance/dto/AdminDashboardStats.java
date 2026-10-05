package com.college.attendance.dto;

public record AdminDashboardStats(
    long totalStudents,
    long activeStudents,
    long totalTeachers,
    long activeTeachers,
    long totalDepartments,
    long totalClasses,
    long totalSubjects,
    long totalSessionsToday,
    long pendingCorrectionRequests
) {
}
