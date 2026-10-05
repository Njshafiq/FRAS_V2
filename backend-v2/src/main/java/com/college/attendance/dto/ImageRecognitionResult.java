package com.college.attendance.dto;

public record ImageRecognitionResult(
    boolean successful,
    String studentId,
    Double confidenceScore,
    String message,
    String modelVersion
) {}
