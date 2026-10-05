package com.college.attendance.dto;

import java.util.List;

public record MultiFrameRecognitionRequest(
    Long sessionId,
    List<FrameItem> frames,
    Double threshold
) {
    public record FrameItem(
        String studentId,
        String embeddingData,
        Double frameConfidence
    ) {
    }
}
