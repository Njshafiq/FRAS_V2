package com.college.attendance.controller;

import com.college.attendance.dto.MonthlyAttendanceSummary;
import com.college.attendance.dto.OverallAttendanceSummary;
import com.college.attendance.dto.SemesterAttendanceSummary;
import com.college.attendance.dto.StudentAttendanceHistoryItem;
import com.college.attendance.dto.StudentProfileResponse;
import com.college.attendance.dto.SubjectAttendanceSummary;
import com.college.attendance.dto.TimetableSlotResponse;
import com.college.attendance.service.StudentDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasAnyAuthority('STUDENT', 'ADMIN')")
public class StudentController {

    private final StudentDashboardService studentDashboardService;

    public StudentController(StudentDashboardService studentDashboardService) {
        this.studentDashboardService = studentDashboardService;
    }

    private String resolveStudentId(UserDetails userDetails, String requestedStudentId) {
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("STUDENT"))) {
            // Logged-in student can ONLY view their own records
            return userDetails.getUsername();
        }
        // Admin can view for any requested student
        if (requestedStudentId != null && !requestedStudentId.isBlank()) {
            return requestedStudentId;
        }
        return userDetails != null ? userDetails.getUsername() : "";
    }

    @GetMapping("/dashboard/overall")
    public ResponseEntity<OverallAttendanceSummary> getOverallAttendance(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String studentId) {
        String targetStudentId = resolveStudentId(userDetails, studentId);
        return ResponseEntity.ok(studentDashboardService.getOverallAttendance(targetStudentId));
    }

    @GetMapping("/dashboard/subject-wise")
    public ResponseEntity<List<SubjectAttendanceSummary>> getSubjectWiseAttendance(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String studentId) {
        String targetStudentId = resolveStudentId(userDetails, studentId);
        return ResponseEntity.ok(studentDashboardService.getSubjectWiseAttendance(targetStudentId));
    }

    @GetMapping("/dashboard/monthly")
    public ResponseEntity<List<MonthlyAttendanceSummary>> getMonthlyAttendance(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String studentId) {
        String targetStudentId = resolveStudentId(userDetails, studentId);
        return ResponseEntity.ok(studentDashboardService.getMonthlyAttendance(targetStudentId));
    }

    @GetMapping("/dashboard/semester-wise")
    public ResponseEntity<SemesterAttendanceSummary> getSemesterAttendance(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String studentId) {
        String targetStudentId = resolveStudentId(userDetails, studentId);
        return ResponseEntity.ok(studentDashboardService.getSemesterAttendance(targetStudentId, semester));
    }

    @GetMapping("/dashboard/history")
    public ResponseEntity<List<StudentAttendanceHistoryItem>> getAttendanceHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String studentId) {
        String targetStudentId = resolveStudentId(userDetails, studentId);
        return ResponseEntity.ok(studentDashboardService.getAttendanceHistory(targetStudentId));
    }

    @GetMapping("/profile")
    public ResponseEntity<StudentProfileResponse> getStudentProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String studentId) {
        String targetStudentId = resolveStudentId(userDetails, studentId);
        return ResponseEntity.ok(studentDashboardService.getStudentProfile(targetStudentId));
    }

    @GetMapping("/timetable")
    public ResponseEntity<List<TimetableSlotResponse>> getStudentTimetable(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String studentId) {
        String targetStudentId = resolveStudentId(userDetails, studentId);
        return ResponseEntity.ok(studentDashboardService.getStudentTimetable(targetStudentId));
    }
}
