package com.college.attendance.service;

import com.college.attendance.dto.AdminSecurityActionRequest;
import com.college.attendance.dto.OtpResponse;
import com.college.attendance.dto.StudentRequest;
import com.college.attendance.dto.StudentResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Role;
import com.college.attendance.model.Student;
import com.college.attendance.model.User;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.StudentRepository;
import com.college.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final ClassEntityRepository classEntityRepository;
    private final AcademicYearRepository academicYearRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final AdminSecurityVerificationService securityVerificationService;
    private final AdminAuditLogService auditLogService;
    private final com.college.attendance.repository.FaceDataRepository faceDataRepository;

    public StudentService(StudentRepository studentRepository,
                          ClassEntityRepository classEntityRepository,
                          AcademicYearRepository academicYearRepository,
                          UserService userService,
                          UserRepository userRepository,
                          OtpService otpService,
                          AdminSecurityVerificationService securityVerificationService,
                          AdminAuditLogService auditLogService,
                          com.college.attendance.repository.FaceDataRepository faceDataRepository) {
        this.studentRepository = studentRepository;
        this.classEntityRepository = classEntityRepository;
        this.academicYearRepository = academicYearRepository;
        this.userService = userService;
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.securityVerificationService = securityVerificationService;
        this.auditLogService = auditLogService;
        this.faceDataRepository = faceDataRepository;
    }

    public List<StudentResponse> getAll() {
        List<Student> students = studentRepository.findAll();
        List<String> ids = students.stream().map(Student::getStudentId).toList();
        java.util.Map<String, com.college.attendance.model.FaceData> faceDataMap = new java.util.TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        if (!ids.isEmpty()) {
            for (com.college.attendance.model.FaceData fd : faceDataRepository.findByStudentStudentIdIn(ids)) {
                if (fd != null && fd.getStudent() != null && fd.getStudent().getStudentId() != null) {
                    faceDataMap.put(fd.getStudent().getStudentId(), fd);
                }
            }
        }

        return students.stream().map(s -> toResponse(s, faceDataMap.get(s.getStudentId()))).toList();
    }

    public StudentResponse getById(String studentId) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        return toResponse(student);
    }

    public StudentResponse create(StudentRequest request) {
        if (studentRepository.existsByStudentId(request.studentId())) {
            throw new IllegalArgumentException("Student already exists: " + request.studentId());
        }

        ClassEntity classEntity = classEntityRepository.findById(request.classId())
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + request.classId()));
        AcademicYear academicYear = academicYearRepository.findById(request.academicYearId())
            .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + request.academicYearId()));

        Student student = new Student(request.studentId(), request.name(), request.registerNumber(), classEntity, academicYear);
        student.setGender(request.gender());
        student.setPhone(request.phone());
        student.setEmail(request.email());
        student.setDateOfBirth(request.dateOfBirth());
        student.setEnrollmentDate(request.enrollmentDate());
        student.setActive(request.active());

        // Create or link User account for student login
        User user = userService.findByUsername(request.studentId())
            .orElseGet(() -> userService.createUser(
                request.studentId(),
                "student123", // default password
                request.name(),
                request.email() != null && !request.email().isBlank() ? request.email() : request.studentId() + "@student.college.edu",
                Role.STUDENT
            ));
        student.setUser(user);

        return toResponse(studentRepository.save(student));
    }

    public StudentResponse update(String studentId, StudentRequest request) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        ClassEntity classEntity = classEntityRepository.findById(request.classId())
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + request.classId()));
        AcademicYear academicYear = academicYearRepository.findById(request.academicYearId())
            .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + request.academicYearId()));

        student.setName(request.name());
        student.setRegisterNumber(request.registerNumber());
        student.setClassEntity(classEntity);
        student.setAcademicYear(academicYear);
        student.setGender(request.gender());
        student.setPhone(request.phone());
        student.setEmail(request.email());
        student.setDateOfBirth(request.dateOfBirth());
        student.setEnrollmentDate(request.enrollmentDate());
        student.setActive(request.active());

        if (student.getUser() != null) {
            User u = student.getUser();
            u.setName(request.name());
            if (request.email() != null && !request.email().isBlank()) {
                u.setEmail(request.email());
            }
            userRepository.save(u);
        }

        return toResponse(studentRepository.save(student));
    }

    public OtpResponse requestStudentDeletionOtp(String studentId) {
        if (!studentRepository.existsByStudentId(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        return otpService.generateOtp("STUDENT_DELETE", studentId);
    }

    @Transactional
    public StudentResponse deactivateStudent(String studentId, AdminSecurityActionRequest verification, String adminUsername) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (verification != null) {
            securityVerificationService.verifyAdminAction(adminUsername, verification, "DEACTIVATE_STUDENT", studentId);
        }

        student.setActive(false);
        if (student.getUser() != null) {
            student.getUser().setActive(false);
            userRepository.save(student.getUser());
        }
        Student saved = studentRepository.save(student);

        auditLogService.logAction(
            adminUsername,
            "DEACTIVATE_STUDENT",
            "STUDENT",
            studentId,
            "Student deactivated. Historical attendance preserved.",
            null
        );

        return toResponse(saved);
    }

    @Transactional
    public StudentResponse reactivateStudent(String studentId, String adminUsername) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        student.setActive(true);
        if (student.getUser() != null) {
            student.getUser().setActive(true);
            userRepository.save(student.getUser());
        }
        Student saved = studentRepository.save(student);

        auditLogService.logAction(
            adminUsername,
            "REACTIVATE_STUDENT",
            "STUDENT",
            studentId,
            "Student reactivated.",
            null
        );

        return toResponse(saved);
    }

    @Transactional
    public void deleteStudentWithOtp(String studentId, String otpCode) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        boolean verified = otpService.verifyOtp("STUDENT_DELETE", studentId, otpCode);
        if (!verified) {
            // Also check if provided otpCode was admin action OTP
            try {
                securityVerificationService.verifyAdminAction("admin", new AdminSecurityActionRequest("OTP", null, otpCode), "DEACTIVATE_STUDENT", studentId);
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid or expired OTP for student deletion.");
            }
        } else {
            otpService.clearOtp("STUDENT_DELETE", studentId);
        }

        student.setActive(false);
        if (student.getUser() != null) {
            student.getUser().setActive(false);
            userRepository.save(student.getUser());
        }
        studentRepository.save(student);

        auditLogService.logAction(
            "admin",
            "DEACTIVATE_STUDENT",
            "STUDENT",
            studentId,
            "Student deactivated via legacy OTP endpoint. Historical attendance preserved.",
            null
        );
    }

    public Student getStudentEntity(String studentId) {
        return studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
    }

    private StudentResponse toResponse(Student student) {
        com.college.attendance.model.FaceData fd = student.getFaceData();
        if (fd == null && student.getStudentId() != null) {
            fd = faceDataRepository.findByStudentStudentId(student.getStudentId()).orElse(null);
        }
        return toResponse(student, fd);
    }

    private StudentResponse toResponse(Student student, com.college.attendance.model.FaceData fd) {
        boolean enrolled = fd != null && fd.isActive()
            && fd.getRegistrationStatus() == com.college.attendance.model.FaceRegistrationStatus.COMPLETED
            && fd.getFaceStatus() == com.college.attendance.model.FaceStatus.REGISTERED;
        String bioStatus = "NOT_ENROLLED";
        if (enrolled) {
            bioStatus = "ENROLLED";
        } else if (fd != null && fd.getRegistrationStatus() == com.college.attendance.model.FaceRegistrationStatus.IN_PROGRESS) {
            bioStatus = "PENDING";
        } else if (fd != null && !fd.isActive()) {
            bioStatus = "DISABLED";
        }

        return new StudentResponse(
            student.getStudentId(),
            student.getName(),
            student.getRegisterNumber(),
            student.getClassEntity() != null ? student.getClassEntity().getId() : null,
            student.getAcademicYear() != null ? student.getAcademicYear().getId() : null,
            student.getGender(),
            student.getPhone(),
            student.getEmail(),
            student.getDateOfBirth(),
            student.getEnrollmentDate(),
            student.isActive(),
            enrolled,
            bioStatus,
            student.getCreatedAt(),
            student.getUpdatedAt()
        );
    }
}
