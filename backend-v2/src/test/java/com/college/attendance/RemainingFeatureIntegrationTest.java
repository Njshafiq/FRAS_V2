package com.college.attendance;

import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Department;
import com.college.attendance.model.FaceData;
import com.college.attendance.model.FaceRegistrationStatus;
import com.college.attendance.model.FaceStatus;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.FaceDataRepository;
import com.college.attendance.repository.StudentRepository;
import com.college.attendance.service.FaceDataService;
import com.college.attendance.service.FaceRecognitionService;
import com.college.attendance.service.OtpService;
import com.college.attendance.service.StudentImportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class RemainingFeatureIntegrationTest {

    @Autowired
    private StudentImportService studentImportService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private FaceRecognitionService faceRecognitionService;

    @Autowired
    private FaceDataService faceDataService;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AcademicYearRepository academicYearRepository;

    @Autowired
    private ClassEntityRepository classEntityRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FaceDataRepository faceDataRepository;

    @BeforeEach
    void resetData() {
        faceDataRepository.deleteAll();
        studentRepository.deleteAll();
        classEntityRepository.deleteAll();
        departmentRepository.deleteAll();
        academicYearRepository.deleteAll();
    }

    @Test
    void shouldImportStudentsFromCsvAndDeleteFaceDataWithOtp() throws IOException {
        Department department = departmentRepository.save(new Department("CSE", "Computer Science"));
        AcademicYear academicYear = academicYearRepository.save(new AcademicYear("2025-26", LocalDate.of(2025, 6, 1), LocalDate.of(2026, 5, 31)));
        ClassEntity classEntity = classEntityRepository.save(new ClassEntity("CS-A", "CS-A-2025", academicYear, department, 1));

        String csv = "studentId,name,registerNumber,classId,academicYearId,gender,phone,email,dateOfBirth,enrollmentDate,active\n"
            + "STU-1001,Alice Smith,REG-1001," + classEntity.getId() + "," + academicYear.getId() + ",Female,9999991001,alice@example.com,2004-04-12,2025-06-01,true\n"
            + "STU-1002,Bob Jones,REG-1002," + classEntity.getId() + "," + academicYear.getId() + ",Male,9999991002,bob@example.com,2004-01-11,2025-06-01,true\n";

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "students.csv",
            MediaType.TEXT_PLAIN_VALUE,
            csv.getBytes()
        );

        var imported = studentImportService.importStudents(file);
        assertEquals(2, imported.importedCount());
        assertEquals(2, studentRepository.count());

        com.college.attendance.model.Student student = studentRepository.findById("STU-1001").orElseThrow();
        faceDataService.registerFace(student.getStudentId(), "embedding-data-1", "FaceNet512", java.util.List.of("sample-1.jpg"));

        var otpResponse = otpService.generateFaceDeletionOtp(student.getStudentId());
        assertNotNull(otpResponse.otpCode());
        assertTrue(otpService.verifyFaceDeletionOtp(student.getStudentId(), otpResponse.otpCode()));

        faceDataService.deleteFaceData(student.getStudentId(), otpResponse.otpCode());
        FaceData faceData = faceDataRepository.findByStudentStudentId(student.getStudentId()).orElseThrow();
        assertFalse(faceData.isActive());
        assertEquals(FaceStatus.NOT_REGISTERED, faceData.getFaceStatus());
        assertEquals(FaceRegistrationStatus.NOT_REGISTERED, faceData.getRegistrationStatus());
    }

    @Test
    void shouldReportAiServiceUnavailableWhenPythonServiceIsDown() {
        var result = faceRecognitionService.recognizeFace("STU-9001", "dummy-embedding");
        assertFalse(result.successful());
        assertNotNull(result.message());
    }
}
