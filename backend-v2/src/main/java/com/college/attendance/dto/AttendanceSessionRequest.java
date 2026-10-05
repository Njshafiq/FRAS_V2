package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceSessionRequest(
    @NotNull Long timetableSlotId,
    @NotNull LocalDate sessionDate,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime,
    @NotBlank String status
) {
}
