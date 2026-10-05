package com.college.attendance.controller;

import com.college.attendance.dto.ApiResponse;
import com.college.attendance.dto.AuditLogResponse;
import com.college.attendance.dto.CorrectionApprovalDto;
import com.college.attendance.dto.CorrectionRequestResponse;
import com.college.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminAttendanceWorkflowController {

    private final AttendanceService attendanceService;

    public AdminAttendanceWorkflowController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/correction-requests")
    public ResponseEntity<List<CorrectionRequestResponse>> getAllCorrectionRequests() {
        return ResponseEntity.ok(attendanceService.getAllCorrectionRequests());
    }

    @PostMapping("/correction-requests/{requestId}/review")
    public ResponseEntity<CorrectionRequestResponse> reviewCorrectionRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody CorrectionApprovalDto approvalDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "ADMIN";
        return ResponseEntity.ok(attendanceService.reviewCorrectionRequest(requestId, approvalDto, adminUsername));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogResponse>> getAllAuditLogs() {
        return ResponseEntity.ok(attendanceService.getAllAuditLogs());
    }

    @GetMapping("/audit-logs/session/{sessionId}")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogsForSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(attendanceService.getAuditLogsForSession(sessionId));
    }
}
