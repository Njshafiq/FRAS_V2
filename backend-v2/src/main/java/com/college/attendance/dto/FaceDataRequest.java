package com.college.attendance.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record FaceDataRequest(
    @NotBlank String studentId,
    @NotBlank String embeddingData,
    String modelVersion,
    List<String> sampleImagePaths
) {
}
