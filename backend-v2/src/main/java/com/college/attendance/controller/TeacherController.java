package com.college.attendance.controller;

import com.college.attendance.dto.*;
import com.college.attendance.service.AttendanceReportService;
import com.college.attendance.service.AttendanceService;
import com.college.attendance.service.TeacherFeatureService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
public class TeacherController {

    private final AttendanceService attendanceService;
    private final TeacherFeatureService teacherFeatureService;
    private final AttendanceReportService attendanceReportService;
    private final com.college.attendance.service.TimetableService timetableService;

    public TeacherController(AttendanceService attendanceService,
                             TeacherFeatureService teacherFeatureService,
                             AttendanceReportService attendanceReportService,
                             com.college.attendance.service.TimetableService timetableService) {
        this.attendanceService = attendanceService;
        this.teacherFeatureService = teacherFeatureService;
        this.attendanceReportService = attendanceReportService;
        this.timetableService = timetableService;
    }

    private String resolveTeacherId(UserDetails userDetails, String requestedTeacherId) {
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("TEACHER"))) {
            return userDetails.getUsername();
        }
        if (requestedTeacherId != null && !requestedTeacherId.isBlank()) {
            return requestedTeacherId;
        }
        return userDetails != null ? userDetails.getUsername() : "";
    }

    // -------------------------------------------------------------
    // Dashboard & Profile
    // -------------------------------------------------------------
    @GetMapping("/dashboard")
    public ResponseEntity<TeacherDashboardSummary> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.getTeacherDashboard(tId));
    }

    @GetMapping("/profile")
    public ResponseEntity<TeacherProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(teacherFeatureService.getProfile(tId));
    }

    // -------------------------------------------------------------
    // My Classes & My Subjects
    // -------------------------------------------------------------
    @GetMapping("/classes")
    public ResponseEntity<List<TeacherClassAssignmentResponse>> getMyClasses(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(teacherFeatureService.getAssignedClasses(tId));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<TeacherSubjectAssignmentResponse>> getMySubjects(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(teacherFeatureService.getAssignedSubjects(tId));
    }

    @GetMapping("/classes/{classId}/students")
    public ResponseEntity<ClassStudentListResponse> getStudentsInClass(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(teacherFeatureService.getStudentsInClass(tId, classId));
    }

    @GetMapping("/timetable")
    public ResponseEntity<List<TimetableSlotResponse>> getMyTimetable(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(timetableService.getByTeacher(tId));
    }

    // -------------------------------------------------------------
    // Attendance Sessions Lifecycle
    // -------------------------------------------------------------
    @GetMapping("/attendance-sessions")
    public ResponseEntity<List<AttendanceSessionResponse>> getTeacherSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.getSessionsFiltered(tId, classId, subjectId, date));
    }

    @PostMapping("/attendance-sessions")
    public ResponseEntity<AttendanceSessionResponse> createSession(@Valid @RequestBody AttendanceSessionRequest request) {
        return ResponseEntity.ok(attendanceService.createSession(
            request.timetableSlotId(),
            request.sessionDate(),
            request.startTime(),
            request.endTime(),
            request.status()
        ));
    }

    @PostMapping("/attendance-sessions/quick-start")
    public ResponseEntity<AttendanceSessionResponse> quickStartSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam Long classId,
            @RequestParam Long subjectId,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.startQuickSession(tId, classId, subjectId));
    }

    // -------------------------------------------------------------
    // Single & Bulk Attendance Marking
    // -------------------------------------------------------------
    @PostMapping("/attendance-records")
    public ResponseEntity<AttendanceRecordResponse> markAttendance(
            @Valid @RequestBody AttendanceRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String tId = resolveTeacherId(userDetails, request.markedByTeacherId());
        return ResponseEntity.ok(attendanceService.markAttendance(
            request.sessionId(),
            request.studentId(),
            request.status(),
            request.confidenceScore(),
            tId
        ));
    }

    @PostMapping("/attendance-records/bulk")
    public ResponseEntity<List<AttendanceRecordResponse>> markBulkAttendance(
            @Valid @RequestBody BulkAttendanceRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.markBulkAttendance(request.sessionId(), request, tId));
    }

    @PostMapping("/attendance-sessions/{sessionId}/mark-all-present")
    public ResponseEntity<List<AttendanceRecordResponse>> markAllPresent(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.markAllPresent(sessionId, tId));
    }

    // -------------------------------------------------------------
    // Face Recognition (Single & Multi-frame)
    // -------------------------------------------------------------
    @PostMapping("/attendance-recognition")
    public ResponseEntity<AttendanceRecordResponse> markAttendanceByRecognition(
            @Valid @RequestBody AttendanceRecognitionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String tId = resolveTeacherId(userDetails, request.markedByTeacherId());
        return ResponseEntity.ok(attendanceService.markAttendanceByRecognition(
            request.sessionId(),
            request.studentId(),
            request.embeddingData(),
            request.status(),
            tId
        ));
    }

    @PostMapping("/attendance-recognition/images")
    public ResponseEntity<AttendanceRecordResponse> recognizeImagesAndMarkAttendance(
            @Valid @RequestBody AttendanceImageRecognitionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String teacherId = resolveTeacherId(userDetails, null);
        return ResponseEntity.ok(attendanceService.recognizeAndMarkAttendance(
            request.sessionId(), request.frames(), teacherId));
    }

    @PostMapping("/attendance-recognition/multi-frame")
    public ResponseEntity<MultiFrameRecognitionResponse> markMultiFrameRecognition(
            @Valid @RequestBody MultiFrameRecognitionRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.processMultiFrameRecognition(request, tId));
    }

    // -------------------------------------------------------------
    // Review & Lock
    // -------------------------------------------------------------
    @GetMapping("/attendance-sessions/{sessionId}/review")
    public ResponseEntity<SessionAttendanceReviewResponse> reviewAttendance(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.getSessionReview(sessionId, tId));
    }

    @PostMapping("/attendance-sessions/{sessionId}/submit-and-lock")
    public ResponseEntity<AttendanceSessionResponse> submitAndLock(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.lockSession(sessionId, tId));
    }

    // -------------------------------------------------------------
    // Correction Requests
    // -------------------------------------------------------------
    @PostMapping("/correction-requests")
    public ResponseEntity<CorrectionRequestResponse> submitCorrectionRequest(
            @Valid @RequestBody CorrectionRequestCreateDto dto,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.submitCorrectionRequest(dto, tId));
    }

    @GetMapping("/correction-requests")
    public ResponseEntity<List<CorrectionRequestResponse>> getMyCorrectionRequests(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceService.getCorrectionRequestsByTeacher(tId));
    }

    // -------------------------------------------------------------
    // Attendance Reports & Export
    // -------------------------------------------------------------
    @GetMapping("/reports")
    public ResponseEntity<List<AttendanceReportItem>> getReports(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String tId = resolveTeacherId(userDetails, teacherId);
        return ResponseEntity.ok(attendanceReportService.generateReport(tId, classId, subjectId, studentId, startDate, endDate));
    }

    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReportsCsv(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String teacherId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String tId = resolveTeacherId(userDetails, teacherId);
        List<AttendanceReportItem> items = attendanceReportService.generateReport(tId, classId, subjectId, studentId, startDate, endDate);
        byte[] csvBytes = attendanceReportService.exportReportToCsv(items);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_report.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csvBytes);
    }
}
