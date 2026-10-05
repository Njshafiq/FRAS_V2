package com.college.attendance.dto;

import java.util.List;

public record SessionAttendanceReviewResponse(
    Long sessionId,
    String status,
    int totalStudents,
    int presentCount,
    int absentCount,
    int lateCount,
    List<AttendanceRecordResponse> records
) {
}
