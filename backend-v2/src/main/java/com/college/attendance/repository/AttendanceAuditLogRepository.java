package com.college.attendance.repository;

import com.college.attendance.model.AttendanceAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceAuditLogRepository extends JpaRepository<AttendanceAuditLog, Long> {
    List<AttendanceAuditLog> findBySessionId(Long sessionId);
    List<AttendanceAuditLog> findByStudentId(String studentId);
}
