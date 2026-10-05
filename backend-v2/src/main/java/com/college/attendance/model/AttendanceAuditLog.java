package com.college.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_audit_logs")
public class AttendanceAuditLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "student_id", length = 50, nullable = false)
    private String studentId;

    @Column(name = "previous_status", length = 20, nullable = false)
    private String previousStatus;

    @Column(name = "new_status", length = 20, nullable = false)
    private String newStatus;

    @Column(name = "modified_by", length = 100, nullable = false)
    private String modifiedBy;

    @Column(name = "modification_type", length = 50, nullable = false)
    private String modificationType; // e.g. "CORRECTION_APPROVED", "MANUAL_UPDATE"

    @Column(name = "remarks", length = 500)
    private String remarks;

    @Column(name = "log_timestamp", nullable = false)
    private LocalDateTime logTimestamp = LocalDateTime.now();

    public AttendanceAuditLog() {
    }

    public AttendanceAuditLog(Long sessionId, String studentId, String previousStatus, String newStatus,
                              String modifiedBy, String modificationType, String remarks) {
        this.sessionId = sessionId;
        this.studentId = studentId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.modifiedBy = modifiedBy;
        this.modificationType = modificationType;
        this.remarks = remarks;
        this.logTimestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(String previousStatus) {
        this.previousStatus = previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public String getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(String modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public String getModificationType() {
        return modificationType;
    }

    public void setModificationType(String modificationType) {
        this.modificationType = modificationType;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getLogTimestamp() {
        return logTimestamp;
    }

    public void setLogTimestamp(LocalDateTime logTimestamp) {
        this.logTimestamp = logTimestamp;
    }
}
