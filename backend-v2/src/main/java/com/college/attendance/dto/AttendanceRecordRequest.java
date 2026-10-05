package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AttendanceRecordRequest(
    @NotNull Long sessionId,
    @NotBlank String studentId,
    @NotBlank String status,
    Double confidenceScore,
    @NotBlank String markedByTeacherId
) {
}
