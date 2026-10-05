package com.college.attendance.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

public record TimetableSlotResponse(
    Long id,
    String teacherId,
    String teacherName,
    Long classId,
    String className,
    String classCode,
    Long subjectId,
    String subjectName,
    String subjectCode,
    String dayOfWeek,
    LocalTime startTime,
    LocalTime endTime,
    String roomNumber,
    boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public TimetableSlotResponse(Long id, String teacherId, Long classId, Long subjectId, String dayOfWeek, LocalTime startTime, LocalTime endTime, String roomNumber, boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, teacherId, null, classId, null, null, subjectId, null, null, dayOfWeek, startTime, endTime, roomNumber, active, createdAt, updatedAt);
    }
}
