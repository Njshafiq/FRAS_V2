package com.college.attendance;

import com.college.attendance.dto.AttendanceRecordResponse;
import com.college.attendance.dto.AttendanceSessionResponse;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.AttendanceStatus;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Department;
import com.college.attendance.model.Subject;
import com.college.attendance.model.Teacher;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.AttendanceSessionRepository;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.StudentRepository;
import com.college.attendance.repository.SubjectRepository;
import com.college.attendance.repository.TeacherClassAssignmentRepository;
import com.college.attendance.repository.TeacherRepository;
import com.college.attendance.repository.TeacherSubjectAssignmentRepository;
import com.college.attendance.repository.TimetableSlotRepository;
import com.college.attendance.service.AttendanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
class AttendanceWorkflowIntegrationTest {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AcademicYearRepository academicYearRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TimetableSlotRepository timetableSlotRepository;

    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;

    @Autowired
    private TeacherClassAssignmentRepository teacherClassAssignmentRepository;

    @Autowired
    private TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;

    @BeforeEach
    void resetData() {
        attendanceSessionRepository.deleteAll();
        timetableSlotRepository.deleteAll();
        teacherSubjectAssignmentRepository.deleteAll();
        teacherClassAssignmentRepository.deleteAll();
        studentRepository.deleteAll();
        subjectRepository.deleteAll();
        teacherRepository.deleteAll();
        classEntityRepository.deleteAll();
        departmentRepository.deleteAll();
        academicYearRepository.deleteAll();
    }

    @Test
    void shouldCreateAttendanceSessionAndMarkRecord() {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("CS-A", "CS-A-2025", academicYear, department, 1));
        Subject subject = subjectRepository.save(new Subject("DBMS101", "Database Management", department, 1, 4));
        Teacher teacher = teacherRepository.save(new Teacher("T-201", "Charlie Brown", department));

        com.college.attendance.model.TimetableSlot timetableSlot = timetableSlotRepository.save(
            new com.college.attendance.model.TimetableSlot(classEntity, subject, teacher, "MONDAY", LocalTime.of(9, 0), LocalTime.of(10, 0))
        );

        AttendanceSessionResponse session = attendanceService.createSession(
            timetableSlot.getId(),
            LocalDate.of(2026, 10, 5),
            LocalTime.of(9, 0),
            LocalTime.of(10, 0),
            "IN_PROGRESS"
        );

        assertEquals("MONDAY", session.dayOfWeek());
        assertEquals("IN_PROGRESS", session.status());

        com.college.attendance.model.Student student = studentRepository.save(new com.college.attendance.model.Student("S-101", "Dana Lee", "REG-101", classEntity, academicYear));
        AttendanceRecordResponse record = attendanceService.markAttendance(session.id(), student.getStudentId(), AttendanceStatus.PRESENT.name(), 0.98d, teacher.getTeacherId());

        assertEquals("S-101", record.studentId());
        assertEquals("PRESENT", record.status());
    }

    @Autowired
    private com.college.attendance.service.StudentDashboardService studentDashboardService;

    @Autowired
    private com.college.attendance.repository.AttendanceCorrectionRequestRepository correctionRequestRepository;

    @Autowired
    private com.college.attendance.repository.AttendanceAuditLogRepository auditLogRepository;

    @Test
    void shouldExecuteCompleteEndToEndWorkflowWithLockAndCorrectionAndAudit() {
        Department department = departmentRepository.save(new Department("IT", "Information Technology"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26-E2E", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = new ClassEntity("IT-A", "IT-A-2025", academicYear, department, 2);
        classEntity.setSection("A");
        classEntity = classEntityRepository.save(classEntity);

        Subject subject = new Subject("CS201", "Data Structures", department, 2, 4);
        subject.setSemester(3);
        subject = subjectRepository.save(subject);

        Teacher teacher = teacherRepository.save(new Teacher("T-E2E", "Prof Smith", department));

        com.college.attendance.model.TimetableSlot timetableSlot = timetableSlotRepository.save(
            new com.college.attendance.model.TimetableSlot(classEntity, subject, teacher, "TUESDAY", LocalTime.of(10, 0), LocalTime.of(11, 0))
        );

        com.college.attendance.model.Student student = studentRepository.save(
            new com.college.attendance.model.Student("STU-E2E-1", "Alice Student", "REG-E2E-1", classEntity, academicYear)
        );

        // 1. Teacher starts session
        AttendanceSessionResponse session = attendanceService.createSession(
            timetableSlot.getId(),
            LocalDate.of(2026, 10, 6),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            "IN_PROGRESS"
        );
        assertEquals("IN_PROGRESS", session.status());

        // 2. Attendance is recorded (Absent initially)
        AttendanceRecordResponse markedRecord = attendanceService.markAttendance(
            session.id(), student.getStudentId(), "ABSENT", 0.0, teacher.getTeacherId()
        );
        assertEquals("ABSENT", markedRecord.status());

        // 3. Teacher reviews session
        var review = attendanceService.getSessionReview(session.id(), teacher.getTeacherId());
        assertEquals(1, review.records().size());
        assertEquals("ABSENT", review.records().get(0).status());

        // 4. Teacher submits and locks session
        var lockedSession = attendanceService.lockSession(session.id(), teacher.getTeacherId());
        assertEquals("LOCKED", lockedSession.status());

        // 5. Verify direct attendance modification fails after LOCKED
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> {
            attendanceService.markAttendance(session.id(), student.getStudentId(), "PRESENT", 1.0, teacher.getTeacherId());
        });

        // 6. Student views own dashboard and attendance history
        var overallSummary = studentDashboardService.getOverallAttendance(student.getStudentId());
        assertEquals(1, overallSummary.totalClasses());
        assertEquals(0, overallSummary.present());
        assertEquals(1, overallSummary.absent());
        assertEquals(0.0, overallSummary.overallPercentage());

        var subjectSummary = studentDashboardService.getSubjectWiseAttendance(student.getStudentId());
        assertEquals(1, subjectSummary.size());
        assertEquals("CS201", subjectSummary.get(0).subjectCode());

        var history = studentDashboardService.getAttendanceHistory(student.getStudentId());
        assertEquals(1, history.size());
        assertEquals("ABSENT", history.get(0).status());

        // 7. Teacher submits correction request (Absent -> Present)
        var correctionDto = new com.college.attendance.dto.CorrectionRequestCreateDto(
            session.id(), student.getStudentId(), "PRESENT", "Student was present, scanner missed"
        );
        var createdCorrection = attendanceService.submitCorrectionRequest(correctionDto, teacher.getTeacherId());
        assertEquals("PENDING", createdCorrection.status());

        // 8. Admin reviews and approves correction request
        var approvalDto = new com.college.attendance.dto.CorrectionApprovalDto(true, "Approved after camera log check");
        var reviewedCorrection = attendanceService.reviewCorrectionRequest(createdCorrection.id(), approvalDto, "adminUser");
        assertEquals("APPROVED", reviewedCorrection.status());

        // 9. Verify record was modified to PRESENT
        var updatedHistory = studentDashboardService.getAttendanceHistory(student.getStudentId());
        assertEquals("PRESENT", updatedHistory.get(0).status());

        var updatedOverall = studentDashboardService.getOverallAttendance(student.getStudentId());
        assertEquals(100.0, updatedOverall.overallPercentage());

        // 10. Verify audit log was created
        var auditLogs = attendanceService.getAuditLogsForSession(session.id());
        assertEquals(1, auditLogs.size());
        assertEquals("ABSENT", auditLogs.get(0).previousStatus());
        assertEquals("PRESENT", auditLogs.get(0).newStatus());
        assertEquals("adminUser", auditLogs.get(0).modifiedBy());
        assertEquals("CORRECTION_APPROVED", auditLogs.get(0).modificationType());
    }

    @Test
    void shouldRejectMarkAllPresentAndBulkAttendanceIfWrongTeacher() {
        Department department = departmentRepository.save(new Department("IT2", "Information Technology 2"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26-FAIL", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("IT-B", "IT-B-2025", academicYear, department, 2));
        Subject subject = subjectRepository.save(new Subject("CS202", "Data Structures 2", department, 2, 4));

        Teacher correctTeacher = teacherRepository.save(new Teacher("T-RIGHT", "Prof Right", department));
        Teacher wrongTeacher = teacherRepository.save(new Teacher("T-WRONG", "Prof Wrong", department));

        com.college.attendance.model.TimetableSlot timetableSlot = timetableSlotRepository.save(
            new com.college.attendance.model.TimetableSlot(classEntity, subject, correctTeacher, "WEDNESDAY", LocalTime.of(10, 0), LocalTime.of(11, 0))
        );

        com.college.attendance.model.Student student = studentRepository.save(
            new com.college.attendance.model.Student("STU-FAIL-1", "Bob Student", "REG-FAIL-1", classEntity, academicYear)
        );

        AttendanceSessionResponse session = attendanceService.createSession(
            timetableSlot.getId(), LocalDate.of(2026, 10, 7), LocalTime.of(10, 0), LocalTime.of(11, 0), "IN_PROGRESS"
        );

        // markAllPresent with null teacher should fail
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markAllPresent(session.id(), null);
        });

        // markAllPresent with wrong teacher should fail
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markAllPresent(session.id(), wrongTeacher.getTeacherId());
        });

        // markAllPresent with correct teacher should succeed
        var markAllResult = attendanceService.markAllPresent(session.id(), correctTeacher.getTeacherId());
        assertEquals(1, markAllResult.size());
        assertEquals("PRESENT", markAllResult.get(0).status());
        
        // markBulkAttendance with null teacher should fail
        com.college.attendance.dto.BulkAttendanceRequest bulkReq = new com.college.attendance.dto.BulkAttendanceRequest(
            session.id(),
            java.util.List.of(new com.college.attendance.dto.BulkAttendanceRequest.StudentAttendanceItem(student.getStudentId(), "ABSENT", 1.0))
        );
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markBulkAttendance(session.id(), bulkReq, null);
        });

        // markBulkAttendance with wrong teacher should fail
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markBulkAttendance(session.id(), bulkReq, wrongTeacher.getTeacherId());
        });

        // markBulkAttendance with correct teacher should succeed
        var markBulkResult = attendanceService.markBulkAttendance(session.id(), bulkReq, correctTeacher.getTeacherId());
        assertEquals(1, markBulkResult.size());
        assertEquals("ABSENT", markBulkResult.get(0).status());
    }

    @Test
    void shouldCheckOwnershipBeforeLockedInMarkAllPresentAndBulk() {
        Department department = departmentRepository.save(new Department("IT3", "Information Technology 3"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26-LOCK", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("IT-C", "IT-C-2025", academicYear, department, 2));
        Subject subject = subjectRepository.save(new Subject("CS203", "Algorithms", department, 2, 4));

        Teacher correctTeacher = teacherRepository.save(new Teacher("T-LOCK-CORRECT", "Prof Lock Correct", department));
        Teacher wrongTeacher = teacherRepository.save(new Teacher("T-LOCK-WRONG", "Prof Lock Wrong", department));

        com.college.attendance.model.TimetableSlot timetableSlot = timetableSlotRepository.save(
            new com.college.attendance.model.TimetableSlot(classEntity, subject, correctTeacher, "FRIDAY", LocalTime.of(10, 0), LocalTime.of(11, 0))
        );

        com.college.attendance.model.Student student = studentRepository.save(
            new com.college.attendance.model.Student("STU-LOCK-1", "Charlie Student", "REG-LOCK-1", classEntity, academicYear)
        );

        AttendanceSessionResponse session = attendanceService.createSession(
            timetableSlot.getId(), LocalDate.of(2026, 10, 9), LocalTime.of(10, 0), LocalTime.of(11, 0), "IN_PROGRESS"
        );

        // Lock the session
        attendanceService.lockSession(session.id(), correctTeacher.getTeacherId());

        com.college.attendance.dto.BulkAttendanceRequest bulkReq = new com.college.attendance.dto.BulkAttendanceRequest(
            session.id(),
            java.util.List.of(new com.college.attendance.dto.BulkAttendanceRequest.StudentAttendanceItem(student.getStudentId(), "PRESENT", 1.0))
        );

        // Wrong/null teacher should fail with ownership IllegalArgumentException, NOT IllegalStateException (locked)
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markAllPresent(session.id(), wrongTeacher.getTeacherId());
        });
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markAllPresent(session.id(), null);
        });
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markBulkAttendance(session.id(), bulkReq, wrongTeacher.getTeacherId());
        });
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            attendanceService.markBulkAttendance(session.id(), bulkReq, null);
        });

        // Correct teacher fails with IllegalStateException (session is locked)
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> {
            attendanceService.markAllPresent(session.id(), correctTeacher.getTeacherId());
        });
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> {
            attendanceService.markBulkAttendance(session.id(), bulkReq, correctTeacher.getTeacherId());
        });
    }
}
