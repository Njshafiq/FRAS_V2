package com.college.attendance.dto;

import java.util.List;

public record BulkAttendanceRequest(
    Long sessionId,
    List<StudentAttendanceItem> attendanceList
) {
    public record StudentAttendanceItem(
        String studentId,
        String status,
        Double confidenceScore
    ) {
    }
}
