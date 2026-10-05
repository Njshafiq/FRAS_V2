package com.college.attendance.dto;

import java.util.List;

public record MultiFrameRecognitionResponse(
    int recognizedCount,
    int unknownCount,
    List<String> recognizedStudentIds,
    List<String> unknownFramesSummary,
    String message
) {
}
