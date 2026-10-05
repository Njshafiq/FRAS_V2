package com.college.attendance.dto;

import java.util.List;

public record TeacherDashboardSummary(
    int assignedClassesCount,
    int assignedSubjectsCount,
    int todaysClassesCount,
    int completedAttendanceTodayCount,
    int pendingAttendanceTodayCount,
    List<TimetableSlotResponse> todaysSchedule
) {
}
