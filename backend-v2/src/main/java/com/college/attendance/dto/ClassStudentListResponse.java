package com.college.attendance.dto;

import java.util.List;

public record ClassStudentListResponse(
    Long classId,
    String className,
    String classCode,
    int totalStudents,
    List<StudentResponse> students
) {
}
