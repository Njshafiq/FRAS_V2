package com.college.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AcademicYearResponse(Long id, String yearName, LocalDate startDate, LocalDate endDate, boolean active,
                                  LocalDateTime createdAt, LocalDateTime updatedAt) {
}
