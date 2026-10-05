package com.college.attendance.dto;

import java.time.LocalDate;

public record StudentProfileResponse(
    String studentId,
    String name,
    String registerNumber,
    Long classId,
    String className,
    String classCode,
    String section,
    Integer yearLevel,
    Long departmentId,
    String departmentName,
    String departmentCode,
    Long academicYearId,
    String academicYearName,
    String email,
    String phone,
    String gender,
    LocalDate dateOfBirth,
    LocalDate enrollmentDate,
    boolean active,
    boolean faceEnrolled
) {}
