package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AttendanceRecognitionRequest(
    @NotNull Long sessionId,
    @NotBlank String studentId,
    @NotBlank String embeddingData,
    String status,
    @NotBlank String markedByTeacherId
) {
}
