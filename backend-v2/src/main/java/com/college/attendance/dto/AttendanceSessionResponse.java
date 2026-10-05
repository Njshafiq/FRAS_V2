package com.college.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AttendanceSessionResponse(
    Long id,
    Long timetableSlotId,
    String teacherId,
    Long classId,
    Long subjectId,
    String dayOfWeek,
    LocalDate sessionDate,
    LocalTime startTime,
    LocalTime endTime,
    String status,
    int presentCount,
    int absentCount,
    int lateCount,
    int totalStudents,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
