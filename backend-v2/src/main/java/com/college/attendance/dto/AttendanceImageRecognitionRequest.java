package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AttendanceImageRecognitionRequest(
    @NotNull Long sessionId,
    @NotNull @Size(min = 3, max = 5) List<@NotBlank String> frames
) {}
