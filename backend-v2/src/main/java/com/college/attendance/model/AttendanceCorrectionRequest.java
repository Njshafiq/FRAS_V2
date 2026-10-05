package com.college.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_correction_requests")
public class AttendanceCorrectionRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession attendanceSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", length = 20, nullable = false)
    private AttendanceStatus currentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_status", length = 20, nullable = false)
    private AttendanceStatus requestedStatus;

    @Column(name = "reason", length = 500, nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private CorrectionRequestStatus status = CorrectionRequestStatus.PENDING;

    @Column(name = "admin_remarks", length = 500)
    private String adminRemarks;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    public AttendanceCorrectionRequest() {
    }

    public AttendanceCorrectionRequest(AttendanceSession attendanceSession, Student student, Teacher teacher,
                                       AttendanceStatus currentStatus, AttendanceStatus requestedStatus, String reason) {
        this.attendanceSession = attendanceSession;
        this.student = student;
        this.teacher = teacher;
        this.currentStatus = currentStatus;
        this.requestedStatus = requestedStatus;
        this.reason = reason;
        this.status = CorrectionRequestStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AttendanceSession getAttendanceSession() {
        return attendanceSession;
    }

    public void setAttendanceSession(AttendanceSession attendanceSession) {
        this.attendanceSession = attendanceSession;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public AttendanceStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(AttendanceStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public AttendanceStatus getRequestedStatus() {
        return requestedStatus;
    }

    public void setRequestedStatus(AttendanceStatus requestedStatus) {
        this.requestedStatus = requestedStatus;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public CorrectionRequestStatus getStatus() {
        return status;
    }

    public void setStatus(CorrectionRequestStatus status) {
        this.status = status;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }
}
