package com.college.attendance.dto;

import java.util.List;

public record SemesterAttendanceSummary(
    Integer semester,
    int totalClasses,
    int present,
    int absent,
    int late,
    double semesterPercentage,
    List<SubjectAttendanceSummary> subjectSummaries
) {
}
