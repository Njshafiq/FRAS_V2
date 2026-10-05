package com.college.attendance.dto;

public record RowFailure(
    int rowNumber,
    String identifier,
    String reason
) {
}
