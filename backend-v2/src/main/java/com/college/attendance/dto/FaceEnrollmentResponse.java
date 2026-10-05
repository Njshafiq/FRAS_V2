package com.college.attendance.dto;

import java.util.List;

public record FaceEnrollmentResponse(
    FaceDataResponse faceData,
    int usableFrames,
    int totalFrames,
    List<String> anglesCovered,
    String message
) {}
