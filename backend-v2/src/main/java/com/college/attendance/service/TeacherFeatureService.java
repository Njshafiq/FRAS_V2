package com.college.attendance.service;

import com.college.attendance.dto.ClassStudentListResponse;
import com.college.attendance.dto.StudentResponse;
import com.college.attendance.dto.SubjectResponse;
import com.college.attendance.dto.TeacherClassAssignmentResponse;
import com.college.attendance.dto.TeacherProfileResponse;
import com.college.attendance.dto.TeacherSubjectAssignmentResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Student;
import com.college.attendance.model.Teacher;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.StudentRepository;
import com.college.attendance.repository.TeacherRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TeacherFeatureService {

    private final TeacherRepository teacherRepository;
    private final TeacherAssignmentService teacherAssignmentService;
    private final ClassEntityRepository classEntityRepository;
    private final StudentRepository studentRepository;
    private final com.college.attendance.repository.FaceDataRepository faceDataRepository;

    public TeacherFeatureService(TeacherRepository teacherRepository,
                                 TeacherAssignmentService teacherAssignmentService,
                                 ClassEntityRepository classEntityRepository,
                                 StudentRepository studentRepository,
                                 com.college.attendance.repository.FaceDataRepository faceDataRepository) {
        this.teacherRepository = teacherRepository;
        this.teacherAssignmentService = teacherAssignmentService;
        this.classEntityRepository = classEntityRepository;
        this.studentRepository = studentRepository;
        this.faceDataRepository = faceDataRepository;
    }

    public TeacherProfileResponse getProfile(String teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherId));

        return new TeacherProfileResponse(
            teacher.getTeacherId(),
            teacher.getName(),
            teacher.getEmail(),
            teacher.getDepartment() != null ? teacher.getDepartment().getName() : null,
            teacher.getDepartment() != null ? teacher.getDepartment().getId() : null,
            teacher.getHireDate(),
            teacher.isActive()
        );
    }

    public List<TeacherClassAssignmentResponse> getAssignedClasses(String teacherId) {
        return teacherAssignmentService.getClassAssignmentsByTeacher(teacherId);
    }

    public List<TeacherSubjectAssignmentResponse> getAssignedSubjects(String teacherId) {
        return teacherAssignmentService.getSubjectAssignmentsByTeacher(teacherId);
    }

    public ClassStudentListResponse getStudentsInClass(String teacherId, Long classId) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherId));

        ClassEntity classEntity = classEntityRepository.findById(classId)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));

        teacherAssignmentService.getClassAssignmentsByTeacher(teacherId).stream()
            .filter(a -> a.classId().equals(classId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(
                String.format("Teacher \"%s\" (ID: %s) is not assigned to class \"%s\" (ID: %d, Code: %s).",
                    teacher.getName(), teacherId, classEntity.getClassName(), classId, classEntity.getClassCode())));


        List<Student> students = studentRepository.findActiveStudentsByClass(classId);
        List<String> studentIds = students.stream().map(Student::getStudentId).toList();
        java.util.Map<String, com.college.attendance.model.FaceData> faceDataMap = new java.util.TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        if (!studentIds.isEmpty()) {
            for (com.college.attendance.model.FaceData fd : faceDataRepository.findByStudentStudentIdIn(studentIds)) {
                if (fd != null && fd.getStudent() != null && fd.getStudent().getStudentId() != null) {
                    faceDataMap.put(fd.getStudent().getStudentId(), fd);
                }
            }
        }

        List<StudentResponse> studentResponses = students.stream().map(s -> {
            com.college.attendance.model.FaceData fd = faceDataMap.get(s.getStudentId());
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
                s.getStudentId(),
                s.getName(),
                s.getRegisterNumber(),
                s.getClassEntity() != null ? s.getClassEntity().getId() : null,
                s.getAcademicYear() != null ? s.getAcademicYear().getId() : null,
                s.getGender(),
                s.getPhone(),
                s.getEmail(),
                s.getDateOfBirth(),
                s.getEnrollmentDate(),
                s.isActive(),
                enrolled,
                bioStatus,
                s.getCreatedAt(),
                s.getUpdatedAt()
            );
        }).toList();

        return new ClassStudentListResponse(
            classEntity.getId(),
            classEntity.getClassName(),
            classEntity.getClassCode(),
            studentResponses.size(),
            studentResponses
        );
    }
}
