package com.college.attendance.controller;

import com.college.attendance.dto.*;
import com.college.attendance.model.AdminAuditLog;
import com.college.attendance.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminController {

    private final AcademicYearService academicYearService;
    private final DepartmentService departmentService;
    private final ClassService classService;
    private final SubjectService subjectService;
    private final TeacherService teacherService;
    private final StudentService studentService;
    private final StudentImportService studentImportService;
    private final TeacherAssignmentService teacherAssignmentService;
    private final TimetableService timetableService;
    private final FaceDataService faceDataService;
    private final OtpService otpService;
    private final com.college.attendance.service.AdminDashboardService adminDashboardService;
    private final CurriculumService curriculumService;
    private final AcademicImportService academicImportService;
    private final TeacherImportService teacherImportService;
    private final AdminSecurityVerificationService securityVerificationService;
    private final AdminAuditLogService adminAuditLogService;

    public AdminController(AcademicYearService academicYearService,
                          DepartmentService departmentService,
                          ClassService classService,
                          SubjectService subjectService,
                          TeacherService teacherService,
                          StudentService studentService,
                          StudentImportService studentImportService,
                          TeacherAssignmentService teacherAssignmentService,
                          TimetableService timetableService,
                          FaceDataService faceDataService,
                          OtpService otpService,
                          com.college.attendance.service.AdminDashboardService adminDashboardService,
                          CurriculumService curriculumService,
                          AcademicImportService academicImportService,
                          TeacherImportService teacherImportService,
                          AdminSecurityVerificationService securityVerificationService,
                          AdminAuditLogService adminAuditLogService) {
        this.academicYearService = academicYearService;
        this.departmentService = departmentService;
        this.classService = classService;
        this.subjectService = subjectService;
        this.teacherService = teacherService;
        this.studentService = studentService;
        this.studentImportService = studentImportService;
        this.teacherAssignmentService = teacherAssignmentService;
        this.timetableService = timetableService;
        this.faceDataService = faceDataService;
        this.otpService = otpService;
        this.adminDashboardService = adminDashboardService;
        this.curriculumService = curriculumService;
        this.academicImportService = academicImportService;
        this.teacherImportService = teacherImportService;
        this.securityVerificationService = securityVerificationService;
        this.adminAuditLogService = adminAuditLogService;
    }

    // -------------------------------------------------------------
    // Dashboard
    // -------------------------------------------------------------
    @GetMapping("/dashboard")
    public ResponseEntity<com.college.attendance.dto.AdminDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminDashboardService.getDashboardStats());
    }

    // -------------------------------------------------------------
    // Academic Years
    // -------------------------------------------------------------
    @GetMapping("/academic-years")
    public ResponseEntity<List<AcademicYearResponse>> getAcademicYears() {
        return ResponseEntity.ok(academicYearService.getAll());
    }

    @GetMapping("/academic-years/{id}")
    public ResponseEntity<AcademicYearResponse> getAcademicYearById(@PathVariable Long id) {
        return ResponseEntity.ok(academicYearService.getById(id));
    }

    @GetMapping("/academic-years/active")
    public ResponseEntity<AcademicYearResponse> getActiveAcademicYear() {
        return ResponseEntity.ok(academicYearService.getActive());
    }

    @PostMapping("/academic-years")
    public ResponseEntity<AcademicYearResponse> createAcademicYear(@Valid @RequestBody AcademicYearRequest request) {
        return ResponseEntity.ok(academicYearService.create(request));
    }

    @PutMapping("/academic-years/{id}")
    public ResponseEntity<AcademicYearResponse> updateAcademicYear(@PathVariable Long id, @Valid @RequestBody AcademicYearRequest request) {
        return ResponseEntity.ok(academicYearService.update(id, request));
    }

    @PutMapping("/academic-years/{id}/set-active")
    public ResponseEntity<AcademicYearResponse> setActiveAcademicYear(@PathVariable Long id) {
        return ResponseEntity.ok(academicYearService.setActive(id));
    }

    // -------------------------------------------------------------
    // Departments
    // -------------------------------------------------------------
    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> getDepartments() {
        return ResponseEntity.ok(departmentService.getAll());
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<DepartmentResponse> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getById(id));
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentResponse> createDepartment(@Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(departmentService.create(request));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(departmentService.update(id, request));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<ApiResponse> deleteDepartment(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.ok(new ApiResponse("Department deactivated successfully", true));
    }

    // -------------------------------------------------------------
    // Classes / Sections
    // -------------------------------------------------------------
    @GetMapping("/classes")
    public ResponseEntity<List<ClassResponse>> getClasses() {
        return ResponseEntity.ok(classService.getAll());
    }

    @GetMapping("/classes/{id}")
    public ResponseEntity<ClassResponse> getClassById(@PathVariable Long id) {
        return ResponseEntity.ok(classService.getById(id));
    }

    @PostMapping("/classes")
    public ResponseEntity<ClassResponse> createClass(@Valid @RequestBody ClassRequest request) {
        return ResponseEntity.ok(classService.create(request));
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<ClassResponse> updateClass(@PathVariable Long id, @Valid @RequestBody ClassRequest request) {
        return ResponseEntity.ok(classService.update(id, request));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<ApiResponse> deleteClass(@PathVariable Long id) {
        classService.delete(id);
        return ResponseEntity.ok(new ApiResponse("Class deactivated successfully", true));
    }

    // -------------------------------------------------------------
    // Subjects
    // -------------------------------------------------------------
    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectResponse>> getSubjects() {
        return ResponseEntity.ok(subjectService.getAll());
    }

    @GetMapping("/subjects/{id}")
    public ResponseEntity<SubjectResponse> getSubjectById(@PathVariable Long id) {
        return ResponseEntity.ok(subjectService.getById(id));
    }

    @PostMapping("/subjects")
    public ResponseEntity<SubjectResponse> createSubject(@Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(subjectService.create(request));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<SubjectResponse> updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(subjectService.update(id, request));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse> deleteSubject(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.ok(new ApiResponse("Subject deactivated successfully", true));
    }

    // -------------------------------------------------------------
    // Curriculum
    // -------------------------------------------------------------
    @GetMapping("/curriculum")
    public ResponseEntity<List<CurriculumResponse>> getCurriculum(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Integer semester) {
        if (departmentId != null || semester != null) {
            return ResponseEntity.ok(curriculumService.getByDepartmentAndSemester(departmentId, semester));
        }
        return ResponseEntity.ok(curriculumService.getAll());
    }

    @GetMapping("/curriculum/{id}")
    public ResponseEntity<CurriculumResponse> getCurriculumById(@PathVariable Long id) {
        return ResponseEntity.ok(curriculumService.getById(id));
    }

    @PostMapping("/curriculum")
    public ResponseEntity<CurriculumResponse> createCurriculum(@Valid @RequestBody CurriculumRequest request) {
        return ResponseEntity.ok(curriculumService.create(request));
    }

    @PutMapping("/curriculum/{id}")
    public ResponseEntity<CurriculumResponse> updateCurriculum(@PathVariable Long id, @Valid @RequestBody CurriculumRequest request) {
        return ResponseEntity.ok(curriculumService.update(id, request));
    }

    @DeleteMapping("/curriculum/{id}")
    public ResponseEntity<ApiResponse> deleteCurriculum(@PathVariable Long id) {
        curriculumService.delete(id);
        return ResponseEntity.ok(new ApiResponse("Curriculum entry deactivated successfully", true));
    }

    // -------------------------------------------------------------
    // Academic Imports (Individual & Combined Excel)
    // -------------------------------------------------------------
    @PostMapping("/academics/import-combined")
    public ResponseEntity<BulkAcademicImportResponse> importCombinedAcademicData(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(academicImportService.importCombinedAcademicData(file, adminUsername));
    }

    @PostMapping("/departments/import")
    public ResponseEntity<SheetImportSummary> importDepartments(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(academicImportService.importDepartments(file));
    }

    @PostMapping("/classes/import")
    public ResponseEntity<SheetImportSummary> importClasses(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(academicImportService.importClasses(file));
    }

    @PostMapping("/subjects/import")
    public ResponseEntity<SheetImportSummary> importSubjects(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(academicImportService.importSubjects(file));
    }

    @PostMapping("/curriculum/import")
    public ResponseEntity<SheetImportSummary> importCurriculum(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(academicImportService.importCurriculum(file));
    }

    // -------------------------------------------------------------
    // Teachers
    // -------------------------------------------------------------
    @GetMapping("/teachers")
    public ResponseEntity<List<TeacherResponse>> getTeachers() {
        return ResponseEntity.ok(teacherService.getAll());
    }

    @GetMapping("/teachers/{teacherId}")
    public ResponseEntity<TeacherResponse> getTeacherById(@PathVariable String teacherId) {
        return ResponseEntity.ok(teacherService.getById(teacherId));
    }

    @PostMapping("/teachers")
    public ResponseEntity<TeacherResponse> createTeacher(@Valid @RequestBody TeacherRequest request) {
        return ResponseEntity.ok(teacherService.create(request));
    }

    @PutMapping("/teachers/{teacherId}")
    public ResponseEntity<TeacherResponse> updateTeacher(@PathVariable String teacherId, @Valid @RequestBody TeacherRequest request) {
        return ResponseEntity.ok(teacherService.update(teacherId, request));
    }

    @PostMapping("/teachers/{teacherId}/deactivate")
    public ResponseEntity<TeacherResponse> deactivateTeacher(
            @PathVariable String teacherId,
            @RequestBody(required = false) AdminSecurityActionRequest verification,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(teacherService.deactivateTeacher(teacherId, verification, adminUsername));
    }

    @PostMapping("/teachers/{teacherId}/reactivate")
    public ResponseEntity<TeacherResponse> reactivateTeacher(
            @PathVariable String teacherId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(teacherService.reactivateTeacher(teacherId, adminUsername));
    }

    @PostMapping("/teachers/import")
    public ResponseEntity<TeacherImportResponse> importTeachers(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(teacherImportService.importTeachers(file, adminUsername));
    }

    @PostMapping("/teachers/{teacherId}/delete-otp")
    public ResponseEntity<OtpResponse> requestTeacherDeleteOtp(@PathVariable String teacherId) {
        return ResponseEntity.ok(teacherService.requestTeacherDeletionOtp(teacherId));
    }

    @PostMapping("/teachers/delete")
    public ResponseEntity<ApiResponse> deleteTeacherWithOtp(@Valid @RequestBody DeleteWithOtpRequest request) {
        teacherService.deleteTeacherWithOtp(request.id(), request.otpCode());
        return ResponseEntity.ok(new ApiResponse("Teacher deactivated successfully", true));
    }

    // -------------------------------------------------------------
    // Students
    // -------------------------------------------------------------
    @GetMapping("/students")
    public ResponseEntity<List<StudentResponse>> getStudents() {
        return ResponseEntity.ok(studentService.getAll());
    }

    @GetMapping("/students/{studentId}")
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable String studentId) {
        return ResponseEntity.ok(studentService.getById(studentId));
    }

    @PostMapping("/students")
    public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(studentService.create(request));
    }

    @PutMapping("/students/{studentId}")
    public ResponseEntity<StudentResponse> updateStudent(@PathVariable String studentId, @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(studentService.update(studentId, request));
    }

    @PostMapping("/students/import")
    public ResponseEntity<StudentImportResponse> importStudents(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(studentImportService.importStudents(file));
    }

    @PostMapping("/students/{studentId}/deactivate")
    public ResponseEntity<StudentResponse> deactivateStudent(
            @PathVariable String studentId,
            @RequestBody(required = false) AdminSecurityActionRequest verification,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(studentService.deactivateStudent(studentId, verification, adminUsername));
    }

    @PostMapping("/students/{studentId}/reactivate")
    public ResponseEntity<StudentResponse> reactivateStudent(
            @PathVariable String studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(studentService.reactivateStudent(studentId, adminUsername));
    }

    @PostMapping("/students/{studentId}/delete-otp")
    public ResponseEntity<OtpResponse> requestStudentDeleteOtp(@PathVariable String studentId) {
        return ResponseEntity.ok(studentService.requestStudentDeletionOtp(studentId));
    }

    @PostMapping("/students/delete")
    public ResponseEntity<ApiResponse> deleteStudentWithOtp(@Valid @RequestBody DeleteWithOtpRequest request) {
        studentService.deleteStudentWithOtp(request.id(), request.otpCode());
        return ResponseEntity.ok(new ApiResponse("Student deactivated successfully", true));
    }

    // -------------------------------------------------------------
    // Teacher Assignments
    // -------------------------------------------------------------
    @GetMapping("/teacher-class-assignments")
    public ResponseEntity<List<TeacherClassAssignmentResponse>> getTeacherClassAssignments() {
        return ResponseEntity.ok(teacherAssignmentService.getAllClassAssignments());
    }

    @PostMapping("/teacher-class-assignments")
    public ResponseEntity<TeacherClassAssignmentResponse> createTeacherClassAssignment(@Valid @RequestBody TeacherClassAssignmentRequest request) {
        return ResponseEntity.ok(teacherAssignmentService.createClassAssignment(request.teacherId(), request.classId(), request.active()));
    }

    @DeleteMapping("/teacher-class-assignments/{id}")
    public ResponseEntity<ApiResponse> deleteTeacherClassAssignment(@PathVariable Long id) {
        teacherAssignmentService.deleteClassAssignment(id);
        return ResponseEntity.ok(new ApiResponse("Teacher class assignment deleted successfully", true));
    }

    @GetMapping("/teacher-subject-assignments")
    public ResponseEntity<List<TeacherSubjectAssignmentResponse>> getTeacherSubjectAssignments() {
        return ResponseEntity.ok(teacherAssignmentService.getAllSubjectAssignments());
    }

    @PostMapping("/teacher-subject-assignments")
    public ResponseEntity<TeacherSubjectAssignmentResponse> createTeacherSubjectAssignment(@Valid @RequestBody TeacherSubjectAssignmentRequest request) {
        return ResponseEntity.ok(teacherAssignmentService.createSubjectAssignment(request.teacherId(), request.subjectId(), request.classId(), request.active()));
    }

    @PostMapping("/teacher-subject-assignments/bulk")
    public ResponseEntity<BulkTeacherSubjectAssignmentResponse> createBulkTeacherSubjectAssignments(
            @Valid @RequestBody BulkTeacherSubjectAssignmentRequest request) {
        return ResponseEntity.ok(teacherAssignmentService.createBulkSubjectAssignments(request));
    }

    @PostMapping("/teacher-subject-assignments/{id}/toggle-active")
    public ResponseEntity<TeacherSubjectAssignmentResponse> toggleTeacherSubjectAssignmentActive(@PathVariable Long id) {
        return ResponseEntity.ok(teacherAssignmentService.toggleSubjectAssignmentActive(id));
    }

    @DeleteMapping("/teacher-subject-assignments/{id}")
    public ResponseEntity<ApiResponse> deleteTeacherSubjectAssignment(@PathVariable Long id) {
        teacherAssignmentService.deleteSubjectAssignment(id);
        return ResponseEntity.ok(new ApiResponse("Teacher subject assignment deleted successfully", true));
    }

    // -------------------------------------------------------------
    // Timetable
    // -------------------------------------------------------------
    @GetMapping("/timetable")
    public ResponseEntity<List<TimetableSlotResponse>> getTimetable() {
        return ResponseEntity.ok(timetableService.getAll());
    }

    @GetMapping("/timetable/{id}")
    public ResponseEntity<TimetableSlotResponse> getTimetableSlotById(@PathVariable Long id) {
        return ResponseEntity.ok(timetableService.getById(id));
    }

    @PostMapping("/timetable")
    public ResponseEntity<TimetableSlotResponse> createTimetableSlot(@Valid @RequestBody TimetableSlotRequest request) {
        return ResponseEntity.ok(timetableService.create(request));
    }

    @PutMapping("/timetable/{id}")
    public ResponseEntity<TimetableSlotResponse> updateTimetableSlot(@PathVariable Long id, @Valid @RequestBody TimetableSlotRequest request) {
        return ResponseEntity.ok(timetableService.update(id, request));
    }

    @DeleteMapping("/timetable/{id}")
    public ResponseEntity<ApiResponse> deleteTimetableSlot(@PathVariable Long id) {
        timetableService.delete(id);
        return ResponseEntity.ok(new ApiResponse("Timetable slot deleted successfully", true));
    }

    // -------------------------------------------------------------
    // Face Data Management (Admin-only)
    // -------------------------------------------------------------
    @GetMapping("/face-data/{studentId}")
    public ResponseEntity<FaceDataResponse> getFaceData(@PathVariable String studentId) {
        return ResponseEntity.ok(faceDataService.getFaceData(studentId));
    }

    @PostMapping("/face-data")
    public ResponseEntity<FaceDataResponse> registerFaceData(
            @Valid @RequestBody FaceDataRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(faceDataService.registerFaceWithAdmin(
            request.studentId(),
            request.embeddingData(),
            request.modelVersion(),
            request.sampleImagePaths(),
            adminUsername
        ));
    }

    @PostMapping("/face-data/{studentId}/delete-otp")
    public ResponseEntity<FaceDeletionOtpResponse> requestFaceDeletionOtp(@PathVariable String studentId) {
        return ResponseEntity.ok(otpService.generateFaceDeletionOtp(studentId));
    }

    @PostMapping("/face-data/delete")
    public ResponseEntity<ApiResponse> deleteFaceData(@Valid @RequestBody DeleteWithOtpRequest request) {
        faceDataService.deleteFaceData(request.id(), request.otpCode());
        return ResponseEntity.ok(new ApiResponse("Face data deleted successfully for student " + request.id(), true));
    }

    @PostMapping("/face-data/{studentId}/delete-secure")
    public ResponseEntity<ApiResponse> deleteFaceDataSecure(
            @PathVariable String studentId,
            @RequestBody(required = false) AdminSecurityActionRequest verification,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        faceDataService.deleteFaceDataWithAdmin(studentId, verification, adminUsername);
        return ResponseEntity.ok(new ApiResponse("Face data deleted successfully for student " + studentId, true));
    }

    // -------------------------------------------------------------
    // Admin Profile & Security Verification
    // -------------------------------------------------------------
    @GetMapping("/profile")
    public ResponseEntity<AdminProfileResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(securityVerificationService.getAdminProfile(username));
    }

    @PutMapping("/profile")
    public ResponseEntity<AdminProfileResponse> updateProfile(
            @Valid @RequestBody AdminProfileUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(securityVerificationService.updateAdminProfile(username, request));
    }

    @PostMapping("/security/request-otp")
    public ResponseEntity<OtpResponse> requestActionOtp(
            @RequestParam String action,
            @RequestParam(required = false) String targetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(securityVerificationService.requestActionOtp(username, action, targetId));
    }

    @PostMapping("/profile/request-contact-otp")
    public ResponseEntity<OtpResponse> requestContactOtp(
            @RequestParam String contactType,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(securityVerificationService.requestContactVerificationOtp(username, contactType));
    }

    @PostMapping("/profile/verify-contact")
    public ResponseEntity<AdminProfileResponse> verifyContact(
            @Valid @RequestBody AdminContactOtpVerifyRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "admin";
        return ResponseEntity.ok(securityVerificationService.verifyContact(username, request));
    }

    // -------------------------------------------------------------
    // Audit Logs
    // -------------------------------------------------------------
    @GetMapping("/admin-audit-logs")
    public ResponseEntity<List<AdminAuditLog>> getAuditLogs() {
        return ResponseEntity.ok(adminAuditLogService.getRecentLogs());
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse> health() {
        return ResponseEntity.ok(new ApiResponse("Admin endpoint is available", true));
    }
}
