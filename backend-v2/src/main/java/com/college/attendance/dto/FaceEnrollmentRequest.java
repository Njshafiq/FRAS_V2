package com.college.attendance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FaceEnrollmentRequest(
    @NotBlank String studentId,
    @NotBlank String name,
    @NotNull @Valid PoseFrames poses
) {
    public record PoseFrames(
        @NotEmpty List<@NotBlank String> front,
        List<@NotBlank String> left,
        List<@NotBlank String> right
    ) {}
}
