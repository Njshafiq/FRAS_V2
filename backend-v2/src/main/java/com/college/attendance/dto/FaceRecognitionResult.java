package com.college.attendance.dto;

public record FaceRecognitionResult(
    boolean successful,
    Double confidenceScore,
    String message,
    String modelVersion
) {
}
