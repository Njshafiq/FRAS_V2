package com.college.attendance.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StudentResponse(String studentId, String name, String registerNumber, Long classId, Long academicYearId,
                             String gender, String phone, String email, LocalDate dateOfBirth, LocalDate enrollmentDate,
                             boolean active, boolean faceEnrolled, String biometricStatus, LocalDateTime createdAt, LocalDateTime updatedAt) {

    public StudentResponse(String studentId, String name, String registerNumber, Long classId, Long academicYearId,
                           String gender, String phone, String email, LocalDate dateOfBirth, LocalDate enrollmentDate,
                           boolean active, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(studentId, name, registerNumber, classId, academicYearId, gender, phone, email, dateOfBirth, enrollmentDate, active, false, "NOT_ENROLLED", createdAt, updatedAt);
    }

    public String getStatus() {
        return active ? "ACTIVE" : "INACTIVE";
    }
}
