package com.college.attendance;

import com.college.attendance.dto.BulkTeacherSubjectAssignmentRequest;
import com.college.attendance.dto.BulkTeacherSubjectAssignmentResponse;
import com.college.attendance.dto.TeacherClassAssignmentResponse;
import com.college.attendance.dto.TeacherSubjectAssignmentResponse;
import com.college.attendance.dto.TimetableSlotResponse;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Curriculum;
import com.college.attendance.model.Department;
import com.college.attendance.model.Subject;
import com.college.attendance.model.Teacher;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.CurriculumRepository;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.SubjectRepository;
import com.college.attendance.repository.TeacherClassAssignmentRepository;
import com.college.attendance.repository.TeacherRepository;
import com.college.attendance.repository.TeacherSubjectAssignmentRepository;
import com.college.attendance.service.SubjectService;
import com.college.attendance.service.TeacherAssignmentService;
import com.college.attendance.service.TimetableService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class TeacherAssignmentIntegrationTest {

    @Autowired
    private TeacherAssignmentService teacherAssignmentService;

    @Autowired
    private SubjectService subjectService;

    @Autowired
    private TimetableService timetableService;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AcademicYearRepository academicYearRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Autowired
    private TeacherClassAssignmentRepository teacherClassAssignmentRepository;

    @Autowired
    private TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;

    @BeforeEach
    void resetData() {
        timetableService.deleteAll();
        teacherAssignmentService.deleteAll();
        curriculumRepository.deleteAll();
        subjectRepository.deleteAll();
        classEntityRepository.deleteAll();
        teacherRepository.deleteAll();
        departmentRepository.deleteAll();
        academicYearRepository.deleteAll();
    }

    @Test
    void shouldCreateTeacherClassAssignment() {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("CS-A", "CS-A-2025", academicYear, department, 1));
        teacherRepository.save(new Teacher("T-101", "Alice Johnson", department));

        TeacherClassAssignmentResponse response = teacherAssignmentService.createClassAssignment("T-101", classEntity.getId(), true);

        assertEquals("T-101", response.teacherId());
        assertEquals(classEntity.getId(), response.classId());
    }

    @Test
    void shouldCreateTimetableSlotForAssignedTeacher() {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("CS-A", "CS-A-2025", academicYear, department, 1));
        Subject subject = subjectRepository.save(new Subject("DBMS101", "Database Management", department, 1, 4));
        teacherRepository.save(new Teacher("T-102", "Bob Smith", department));

        teacherAssignmentService.createClassAssignment("T-102", classEntity.getId(), true);
        teacherAssignmentService.createSubjectAssignment("T-102", subject.getId(), classEntity.getId(), true);

        TimetableSlotResponse response = timetableService.create(
            "T-102",
            classEntity.getId(),
            subject.getId(),
            "MONDAY",
            LocalTime.of(9, 0),
            LocalTime.of(10, 0),
            "A-101",
            true
        );

        assertEquals("MONDAY", response.dayOfWeek());
        assertEquals("T-102", response.teacherId());
        assertEquals(classEntity.getId(), response.classId());
    }

    @Test
    void shouldFailTimetableSlotUpdateIfAssignmentMissing() {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("CS-A", "CS-A-2025", academicYear, department, 1));
        Subject subject = subjectRepository.save(new Subject("DBMS101", "Database Management", department, 1, 4));
        teacherRepository.save(new Teacher("T-103", "Eve Adams", department));

        teacherAssignmentService.createClassAssignment("T-103", classEntity.getId(), true);
        teacherAssignmentService.createSubjectAssignment("T-103", subject.getId(), classEntity.getId(), true);

        TimetableSlotResponse slot = timetableService.create("T-103", classEntity.getId(), subject.getId(), "TUESDAY", LocalTime.of(9, 0), LocalTime.of(10, 0), "A-101", true);

        teacherRepository.save(new Teacher("T-104", "Frank White", department));
        
        com.college.attendance.dto.TimetableSlotRequest req = new com.college.attendance.dto.TimetableSlotRequest(
            "T-104", classEntity.getId(), subject.getId(), "TUESDAY", LocalTime.of(9, 0), LocalTime.of(10, 0), "A-101", true
        );

        assertThrows(IllegalArgumentException.class, () -> {
            timetableService.update(slot.id(), req);
        });
        
        teacherAssignmentService.createClassAssignment("T-104", classEntity.getId(), true);
        teacherAssignmentService.createSubjectAssignment("T-104", subject.getId(), classEntity.getId(), true);
        TimetableSlotResponse updatedSlot = timetableService.update(slot.id(), req);
        assertEquals("T-104", updatedSlot.teacherId());
    }

    @Test
    void shouldFailToDeleteSubjectAssignmentIfUsedInTimetable() {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("CS-A", "CS-A-2025", academicYear, department, 1));
        Subject subject = subjectRepository.save(new Subject("DBMS101", "Database Management", department, 1, 4));
        teacherRepository.save(new Teacher("T-105", "Grace Lee", department));

        teacherAssignmentService.createClassAssignment("T-105", classEntity.getId(), true);
        var subjAssign = teacherAssignmentService.createSubjectAssignment("T-105", subject.getId(), classEntity.getId(), true);

        timetableService.create("T-105", classEntity.getId(), subject.getId(), "WEDNESDAY", LocalTime.of(9, 0), LocalTime.of(10, 0), "A-101", true);

        assertThrows(IllegalStateException.class, () -> {
            teacherAssignmentService.deleteSubjectAssignment(subjAssign.id());
        });
    }

    @Test
    void shouldAutomaticallyEnsureTeacherClassAssignmentWhenCreatingSubjectAssignment() {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("CS-B", "CS-B-2025", academicYear, department, 2));
        Subject subject = subjectRepository.save(new Subject("DSA01", "Data Structures", department, 2, 4));
        Teacher teacher = teacherRepository.save(new Teacher("T-KUMAR", "Mr. Kumar", department));

        // Create subject assignment WITHOUT explicitly creating class assignment
        TeacherSubjectAssignmentResponse response = teacherAssignmentService.createSubjectAssignment("T-KUMAR", subject.getId(), classEntity.getId(), true);

        assertNotNull(response);
        assertEquals("T-KUMAR", response.teacherId());
        assertEquals("Mr. Kumar", response.teacherName());
        assertEquals(subject.getId(), response.subjectId());
        assertEquals("DSA01", response.subjectCode());

        // Verify TeacherClassAssignment was automatically created in the same transaction
        boolean classAssigned = teacherClassAssignmentRepository.existsByTeacherTeacherIdAndClassEntityId("T-KUMAR", classEntity.getId());
        assertTrue(classAssigned, "TeacherClassAssignment must be automatically ensured");

        // Verify duplicate is cleanly prevented with friendly message
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            teacherAssignmentService.createSubjectAssignment("T-KUMAR", subject.getId(), classEntity.getId(), true);
        });
        assertTrue(ex.getMessage().contains("\"Mr. Kumar\" already teaches \"DSA01 - Data Structures\" for \"CS-B\""));
    }

    @Test
    void shouldSupportSharedSubjectAcrossDepartmentsViaCurriculum() {
        Department cseDept = departmentRepository.save(new Department("CSE", "Computer Science"));
        Department itDept = departmentRepository.save(new Department("IT", "Information Technology"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));

        // Master subject owned by CSE
        Subject dsaSubject = subjectRepository.save(new Subject("DSA01", "Data Structures", cseDept, 2, 4));

        // Mapped to IT department via Curriculum
        curriculumRepository.save(new Curriculum("R2021", itDept, 3, dsaSubject, 4, "CORE"));

        ClassEntity cseClass = classEntityRepository.save(new ClassEntity("CSE 2A", "CSE-2A-2025", academicYear, cseDept, 2));
        ClassEntity itClass = classEntityRepository.save(new ClassEntity("IT 2A", "IT-2A-2025", academicYear, itDept, 2));

        Teacher kumar = teacherRepository.save(new Teacher("T-KUMAR-2", "Mr. Kumar", cseDept));

        // Assign to CSE class
        var cseAssign = teacherAssignmentService.createSubjectAssignment("T-KUMAR-2", dsaSubject.getId(), cseClass.getId(), true);
        assertNotNull(cseAssign);

        // Assign to IT class (shared subject across departments, teacher teaching across departments)
        var itAssign = teacherAssignmentService.createSubjectAssignment("T-KUMAR-2", dsaSubject.getId(), itClass.getId(), true);
        assertNotNull(itAssign);
        assertEquals("IT 2A", itAssign.className());

        // Verify automatic class assignments for both departments
        assertTrue(teacherClassAssignmentRepository.existsByTeacherTeacherIdAndClassEntityId("T-KUMAR-2", cseClass.getId()));
        assertTrue(teacherClassAssignmentRepository.existsByTeacherTeacherIdAndClassEntityId("T-KUMAR-2", itClass.getId()));
    }

    @Test
    void shouldSupportCommonCollegeWideSubjectWithoutDepartment() {
        Department cseDept = departmentRepository.save(new Department("CSE", "Computer Science"));
        Department eceDept = departmentRepository.save(new Department("ECE", "Electronics & Comm"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));

        // College-wide common subject (department is null)
        Subject mathSubject = subjectRepository.save(new Subject("MATH101", "Engineering Mathematics I", null, 1, 4));

        ClassEntity cseClass = classEntityRepository.save(new ClassEntity("CSE 1A", "CSE-1A-2025", academicYear, cseDept, 1));
        ClassEntity eceClass = classEntityRepository.save(new ClassEntity("ECE 1A", "ECE-1A-2025", academicYear, eceDept, 1));

        Teacher teacher = teacherRepository.save(new Teacher("T-MATH", "Dr. Ramanujan", cseDept));

        var cseAssign = teacherAssignmentService.createSubjectAssignment("T-MATH", mathSubject.getId(), cseClass.getId(), true);
        var eceAssign = teacherAssignmentService.createSubjectAssignment("T-MATH", mathSubject.getId(), eceClass.getId(), true);

        assertNotNull(cseAssign);
        assertNotNull(eceAssign);
    }

    @Test
    void shouldSupportMultipleTeachersForSameSubjectAcrossClasses() {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));

        Subject dsaSubject = subjectRepository.save(new Subject("DSA01", "Data Structures", department, 2, 4));
        ClassEntity cse2A = classEntityRepository.save(new ClassEntity("CSE 2A", "CSE-2A-2025", academicYear, department, 2));
        ClassEntity cse2B = classEntityRepository.save(new ClassEntity("CSE 2B", "CSE-2B-2025", academicYear, department, 2));

        Teacher kumar = teacherRepository.save(new Teacher("T-KUMAR-3", "Mr. Kumar", department));
        Teacher ravi = teacherRepository.save(new Teacher("T-RAVI", "Mr. Ravi", department));

        var a1 = teacherAssignmentService.createSubjectAssignment("T-KUMAR-3", dsaSubject.getId(), cse2A.getId(), true);
        var a2 = teacherAssignmentService.createSubjectAssignment("T-RAVI", dsaSubject.getId(), cse2B.getId(), true);

        assertEquals("T-KUMAR-3", a1.teacherId());
        assertEquals("T-RAVI", a2.teacherId());
        assertEquals(dsaSubject.getId(), a1.subjectId());
        assertEquals(dsaSubject.getId(), a2.subjectId());
    }

    @Test
    void shouldRejectAssignmentWhenSubjectNotApplicableToClass() {
        Department cseDept = departmentRepository.save(new Department("CSE", "Computer Science"));
        Department mechDept = departmentRepository.save(new Department("MECH", "Mechanical Engineering"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));

        // Subject belongs to CSE only, no curriculum mapping for MECH
        Subject advancedJava = subjectRepository.save(new Subject("JAVA301", "Advanced Java", cseDept, 3, 3));
        ClassEntity mechClass = classEntityRepository.save(new ClassEntity("MECH 1A", "MECH-1A-2025", academicYear, mechDept, 1));
        Teacher teacher = teacherRepository.save(new Teacher("T-TEACHER", "Prof Alex", cseDept));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            teacherAssignmentService.createSubjectAssignment("T-TEACHER", advancedJava.getId(), mechClass.getId(), true);
        });

        assertEquals("Subject \"JAVA301 - Advanced Java\" is not applicable to class \"MECH 1A\".", ex.getMessage());
    }

    @Test
    void shouldPerformBulkAssignmentWithDetailedPerClassResults() {
        Department cseDept = departmentRepository.save(new Department("CSE", "Computer Science"));
        Department itDept = departmentRepository.save(new Department("IT", "Information Technology"));
        Department civilDept = departmentRepository.save(new Department("CIVIL", "Civil Engineering"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));

        Subject dsa = subjectRepository.save(new Subject("DSA01", "Data Structures", cseDept, 2, 4));
        curriculumRepository.save(new Curriculum("R2021", itDept, 3, dsa, 4, "CORE"));

        ClassEntity cse2A = classEntityRepository.save(new ClassEntity("CSE 2A", "CSE-2A-2025", academicYear, cseDept, 2));
        ClassEntity it2A = classEntityRepository.save(new ClassEntity("IT 2A", "IT-2A-2025", academicYear, itDept, 2));
        ClassEntity civil1A = classEntityRepository.save(new ClassEntity("CIVIL 1A", "CIVIL-1A-2025", academicYear, civilDept, 1));

        Teacher kumar = teacherRepository.save(new Teacher("T-KUMAR-BULK", "Mr. Kumar", cseDept));

        // Pre-assign Kumar to CSE 2A
        teacherAssignmentService.createSubjectAssignment("T-KUMAR-BULK", dsa.getId(), cse2A.getId(), true);

        // Bulk assign Kumar to: CSE 2A (already exists), IT 2A (new valid), CIVIL 1A (not applicable)
        BulkTeacherSubjectAssignmentRequest request = new BulkTeacherSubjectAssignmentRequest(
            "T-KUMAR-BULK",
            dsa.getId(),
            List.of(cse2A.getId(), it2A.getId(), civil1A.getId()),
            true
        );

        BulkTeacherSubjectAssignmentResponse bulkRes = teacherAssignmentService.createBulkSubjectAssignments(request);

        assertEquals(1, bulkRes.added(), "Should add IT 2A");
        assertEquals(1, bulkRes.alreadyExisted(), "CSE 2A already existed");
        assertEquals(1, bulkRes.failed(), "CIVIL 1A should fail applicability");

        assertEquals("ALREADY_EXISTS", bulkRes.results().get(0).status());
        assertEquals("ADDED", bulkRes.results().get(1).status());
        assertEquals("FAILED", bulkRes.results().get(2).status());
        assertTrue(bulkRes.results().get(2).message().contains("not applicable to class \"CIVIL 1A\""));

        // Verify IT 2A class assignment automatically ensured
        assertTrue(teacherClassAssignmentRepository.existsByTeacherTeacherIdAndClassEntityId("T-KUMAR-BULK", it2A.getId()));
    }

    @Test
    void shouldPreventSubjectDeletionWithFriendlyCountWhenAssigned() {
        Department cseDept = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        Subject dsa = subjectRepository.save(new Subject("DSA01", "Data Structures", cseDept, 2, 4));
        ClassEntity cse2A = classEntityRepository.save(new ClassEntity("CSE 2A", "CSE-2A-2025", academicYear, cseDept, 2));
        Teacher kumar = teacherRepository.save(new Teacher("T-KUMAR-DEL", "Mr. Kumar", cseDept));

        teacherAssignmentService.createSubjectAssignment("T-KUMAR-DEL", dsa.getId(), cse2A.getId(), true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            subjectService.delete(dsa.getId());
        });

        assertEquals(
            "Cannot delete subject \"DSA01 - Data Structures\". It is currently used by 1 class assignments. Deactivate/remove the dependent records first.",
            ex.getMessage()
        );
    }
}
