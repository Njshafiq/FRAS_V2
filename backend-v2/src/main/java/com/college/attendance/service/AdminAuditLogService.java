package com.college.attendance.service;

import com.college.attendance.model.AdminAuditLog;
import com.college.attendance.repository.AdminAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminAuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditLogService.class);

    private final AdminAuditLogRepository adminAuditLogRepository;

    public AdminAuditLogService(AdminAuditLogRepository adminAuditLogRepository) {
        this.adminAuditLogRepository = adminAuditLogRepository;
    }

    public void logAction(String adminUsername, String action, String targetType, String targetId, String details, String ipAddress) {
        try {
            AdminAuditLog auditLog = new AdminAuditLog(
                adminUsername != null ? adminUsername : "SYSTEM_ADMIN",
                action,
                targetType,
                targetId,
                details,
                ipAddress
            );
            adminAuditLogRepository.save(auditLog);
            log.info("AdminAuditLog: [admin={}] [action={}] [targetType={}] [targetId={}] {}",
                adminUsername, action, targetType, targetId, details);
        } catch (Exception ex) {
            log.error("Failed to save AdminAuditLog: {}", ex.getMessage(), ex);
        }
    }

    public List<AdminAuditLog> getRecentLogs() {
        return adminAuditLogRepository.findTop50ByOrderByLogTimestampDesc();
    }
}
