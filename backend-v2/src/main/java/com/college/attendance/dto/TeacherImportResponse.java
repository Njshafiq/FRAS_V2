package com.college.attendance.dto;

import java.util.List;

public record TeacherImportResponse(
    int importedCount,
    int skippedCount,
    int totalRows,
    List<RowFailure> failures,
    String message
) {
}
