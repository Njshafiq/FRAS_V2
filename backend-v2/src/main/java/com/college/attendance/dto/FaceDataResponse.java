package com.college.attendance.dto;

import java.time.LocalDateTime;

public record FaceDataResponse(
    Long id,
    String studentId,
    String modelVersion,
    String registrationStatus,
    String faceStatus,
    boolean active,
    LocalDateTime registrationTimestamp
) {
}
