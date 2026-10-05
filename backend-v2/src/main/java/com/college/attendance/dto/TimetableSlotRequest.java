package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record TimetableSlotRequest(
    @NotBlank String teacherId,
    @NotNull Long classId,
    @NotNull Long subjectId,
    @NotBlank String dayOfWeek,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime,
    String roomNumber,
    boolean active
) {
}
