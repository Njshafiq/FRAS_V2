package com.college.attendance.service;

import com.college.attendance.dto.AdminSecurityActionRequest;
import com.college.attendance.dto.OtpResponse;
import com.college.attendance.dto.TeacherRequest;
import com.college.attendance.dto.TeacherResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.Department;
import com.college.attendance.model.Role;
import com.college.attendance.model.Teacher;
import com.college.attendance.model.User;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.TeacherRepository;
import com.college.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final AdminSecurityVerificationService securityVerificationService;
    private final AdminAuditLogService auditLogService;

    public TeacherService(TeacherRepository teacherRepository,
                          DepartmentRepository departmentRepository,
                          UserService userService,
                          UserRepository userRepository,
                          OtpService otpService,
                          AdminSecurityVerificationService securityVerificationService,
                          AdminAuditLogService auditLogService) {
        this.teacherRepository = teacherRepository;
        this.departmentRepository = departmentRepository;
        this.userService = userService;
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.securityVerificationService = securityVerificationService;
        this.auditLogService = auditLogService;
    }

    public List<TeacherResponse> getAll() {
        return teacherRepository.findAll().stream().map(this::toResponse).toList();
    }

    public TeacherResponse getById(String teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));
        return toResponse(teacher);
    }

    public TeacherResponse create(TeacherRequest request) {
        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));

        if (teacherRepository.existsById(request.teacherId())) {
            throw new IllegalArgumentException("Teacher already exists: " + request.teacherId());
        }

        Teacher teacher = new Teacher(request.teacherId(), request.name(), department);
        teacher.setEmail(request.email());
        teacher.setHireDate(request.hireDate());
        teacher.setActive(request.active());

        // Create or link User account for teacher login
        User user = userService.findByUsername(request.teacherId())
            .orElseGet(() -> userService.createUser(
                request.teacherId(),
                "teacher123",
                request.name(),
                request.email() != null && !request.email().isBlank() ? request.email() : request.teacherId() + "@faculty.college.edu",
                Role.TEACHER
            ));
        teacher.setUser(user);

        return toResponse(teacherRepository.save(teacher));
    }

    public TeacherResponse update(String teacherId, TeacherRequest request) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));

        teacher.setName(request.name());
        teacher.setDepartment(department);
        teacher.setEmail(request.email());
        teacher.setHireDate(request.hireDate());
        teacher.setActive(request.active());

        if (teacher.getUser() != null) {
            User u = teacher.getUser();
            u.setName(request.name());
            if (request.email() != null && !request.email().isBlank()) {
                u.setEmail(request.email());
            }
            userRepository.save(u);
        }

        return toResponse(teacherRepository.save(teacher));
    }

    public OtpResponse requestTeacherDeletionOtp(String teacherId) {
        if (!teacherRepository.existsById(teacherId)) {
            throw new ResourceNotFoundException("Teacher not found with id: " + teacherId);
        }
        return otpService.generateOtp("TEACHER_DELETE", teacherId);
    }

    @Transactional
    public TeacherResponse deactivateTeacher(String teacherId, AdminSecurityActionRequest verification, String adminUsername) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        if (verification != null) {
            securityVerificationService.verifyAdminAction(adminUsername, verification, "DEACTIVATE_TEACHER", teacherId);
        }

        teacher.setActive(false);
        if (teacher.getUser() != null) {
            teacher.getUser().setActive(false);
            userRepository.save(teacher.getUser());
        }
        Teacher saved = teacherRepository.save(teacher);

        auditLogService.logAction(
            adminUsername,
            "DEACTIVATE_TEACHER",
            "TEACHER",
            teacherId,
            "Teacher deactivated. Associations and attendance preserved.",
            null
        );

        return toResponse(saved);
    }

    @Transactional
    public TeacherResponse reactivateTeacher(String teacherId, String adminUsername) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        teacher.setActive(true);
        if (teacher.getUser() != null) {
            teacher.getUser().setActive(true);
            userRepository.save(teacher.getUser());
        }
        Teacher saved = teacherRepository.save(teacher);

        auditLogService.logAction(
            adminUsername,
            "REACTIVATE_TEACHER",
            "TEACHER",
            teacherId,
            "Teacher reactivated.",
            null
        );

        return toResponse(saved);
    }

    @Transactional
    public void deleteTeacherWithOtp(String teacherId, String otpCode) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        boolean verified = otpService.verifyOtp("TEACHER_DELETE", teacherId, otpCode);
        if (!verified) {
            try {
                securityVerificationService.verifyAdminAction("admin", new AdminSecurityActionRequest("OTP", null, otpCode), "DEACTIVATE_TEACHER", teacherId);
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid or expired OTP for teacher deletion.");
            }
        } else {
            otpService.clearOtp("TEACHER_DELETE", teacherId);
        }

        teacher.setActive(false);
        if (teacher.getUser() != null) {
            teacher.getUser().setActive(false);
            userRepository.save(teacher.getUser());
        }
        teacherRepository.save(teacher);

        auditLogService.logAction(
            "admin",
            "DEACTIVATE_TEACHER",
            "TEACHER",
            teacherId,
            "Teacher deactivated via legacy OTP endpoint. Historical attendance preserved.",
            null
        );
    }

    public Teacher getTeacherEntity(String teacherId) {
        return teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));
    }

    private TeacherResponse toResponse(Teacher teacher) {
        return new TeacherResponse(
            teacher.getTeacherId(),
            teacher.getName(),
            teacher.getDepartment() != null ? teacher.getDepartment().getId() : null,
            teacher.getEmail(),
            teacher.getHireDate(),
            teacher.isActive(),
            teacher.getCreatedAt(),
            teacher.getUpdatedAt()
        );
    }
}
