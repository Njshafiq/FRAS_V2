package com.college.attendance.repository;

import com.college.attendance.model.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    List<AdminAuditLog> findTop50ByOrderByLogTimestampDesc();
    List<AdminAuditLog> findByTargetTypeOrderByLogTimestampDesc(String targetType);
    List<AdminAuditLog> findByTargetIdOrderByLogTimestampDesc(String targetId);
    List<AdminAuditLog> findByAdminUsernameOrderByLogTimestampDesc(String adminUsername);
}
