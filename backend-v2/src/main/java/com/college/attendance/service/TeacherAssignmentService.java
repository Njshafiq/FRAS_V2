package com.college.attendance.service;

import com.college.attendance.dto.BulkTeacherSubjectAssignmentRequest;
import com.college.attendance.dto.BulkTeacherSubjectAssignmentResponse;
import com.college.attendance.dto.TeacherClassAssignmentResponse;
import com.college.attendance.dto.TeacherSubjectAssignmentResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Department;
import com.college.attendance.model.Subject;
import com.college.attendance.model.Teacher;
import com.college.attendance.model.TeacherClassAssignment;
import com.college.attendance.model.TeacherSubjectAssignment;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.CurriculumRepository;
import com.college.attendance.repository.SubjectRepository;
import com.college.attendance.repository.TeacherClassAssignmentRepository;
import com.college.attendance.repository.TeacherRepository;
import com.college.attendance.repository.TeacherSubjectAssignmentRepository;
import com.college.attendance.repository.TimetableSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TeacherAssignmentService {

    private final TeacherClassAssignmentRepository teacherClassAssignmentRepository;
    private final TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;
    private final TeacherRepository teacherRepository;
    private final ClassEntityRepository classEntityRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final CurriculumRepository curriculumRepository;

    public TeacherAssignmentService(TeacherClassAssignmentRepository teacherClassAssignmentRepository,
                                   TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository,
                                   TeacherRepository teacherRepository,
                                   ClassEntityRepository classEntityRepository,
                                   SubjectRepository subjectRepository,
                                   TimetableSlotRepository timetableSlotRepository,
                                   CurriculumRepository curriculumRepository) {
        this.teacherClassAssignmentRepository = teacherClassAssignmentRepository;
        this.teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
        this.teacherRepository = teacherRepository;
        this.classEntityRepository = classEntityRepository;
        this.subjectRepository = subjectRepository;
        this.timetableSlotRepository = timetableSlotRepository;
        this.curriculumRepository = curriculumRepository;
    }

    public List<TeacherClassAssignmentResponse> getAllClassAssignments() {
        return teacherClassAssignmentRepository.findAll().stream()
            .map(this::toClassResponse)
            .toList();
    }

    public List<TeacherClassAssignmentResponse> getClassAssignmentsByTeacher(String teacherId) {
        return teacherClassAssignmentRepository.findByTeacherTeacherId(teacherId).stream()
            .map(this::toClassResponse)
            .toList();
    }

    public TeacherClassAssignmentResponse createClassAssignment(String teacherId, Long classId, boolean active) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));
        ClassEntity classEntity = classEntityRepository.findById(classId)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));

        Optional<TeacherClassAssignment> existingOpt = teacherClassAssignmentRepository.findByTeacherTeacherIdAndClassEntityId(teacherId, classId);
        if (existingOpt.isPresent()) {
            TeacherClassAssignment existing = existingOpt.get();
            if (existing.isActive()) {
                throw new IllegalArgumentException(String.format("Teacher \"%s\" is already assigned to class \"%s\".",
                    teacher.getName(), formatClassName(classEntity)));
            } else {
                existing.setActive(active);
                return toClassResponse(teacherClassAssignmentRepository.save(existing));
            }
        }

        TeacherClassAssignment assignment = new TeacherClassAssignment(teacher, classEntity);
        assignment.setActive(active);
        return toClassResponse(teacherClassAssignmentRepository.save(assignment));
    }

    public void deleteClassAssignment(Long id) {
        if (!teacherClassAssignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Teacher class assignment not found with id: " + id);
        }
        teacherClassAssignmentRepository.deleteById(id);
    }

    public List<TeacherSubjectAssignmentResponse> getAllSubjectAssignments() {
        return teacherSubjectAssignmentRepository.findAll().stream()
            .map(this::toSubjectResponse)
            .toList();
    }

    public List<TeacherSubjectAssignmentResponse> getSubjectAssignmentsByTeacher(String teacherId) {
        return teacherSubjectAssignmentRepository.findByTeacherTeacherId(teacherId).stream()
            .map(this::toSubjectResponse)
            .toList();
    }

    public boolean isSubjectApplicableToClass(Subject subject, ClassEntity classEntity) {
        if (subject == null || classEntity == null) {
            return false;
        }
        // Common / College-wide subject without department constraint
        if (subject.getDepartment() == null) {
            return true;
        }
        // Direct department match
        if (classEntity.getDepartment() != null &&
            subject.getDepartment().getId().equals(classEntity.getDepartment().getId())) {
            return true;
        }
        // Curriculum mapping for this subject in the class's department
        if (classEntity.getDepartment() != null &&
            curriculumRepository.existsByDepartmentIdAndSubjectId(classEntity.getDepartment().getId(), subject.getId())) {
            return true;
        }
        return false;
    }

    public void ensureTeacherClassAssignment(Teacher teacher, ClassEntity classEntity) {
        Optional<TeacherClassAssignment> tcaOpt = teacherClassAssignmentRepository
            .findByTeacherTeacherIdAndClassEntityId(teacher.getTeacherId(), classEntity.getId());
        if (tcaOpt.isEmpty()) {
            TeacherClassAssignment tca = new TeacherClassAssignment(teacher, classEntity);
            tca.setActive(true);
            teacherClassAssignmentRepository.save(tca);
        } else {
            TeacherClassAssignment tca = tcaOpt.get();
            if (!tca.isActive()) {
                tca.setActive(true);
                teacherClassAssignmentRepository.save(tca);
            }
        }
    }

    public TeacherSubjectAssignmentResponse createSubjectAssignment(String teacherId, Long subjectId, Long classId, boolean active) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));
        ClassEntity classEntity = classEntityRepository.findById(classId)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));

        if (!isSubjectApplicableToClass(subject, classEntity)) {
            throw new IllegalArgumentException(String.format(
                "Subject \"%s - %s\" is not applicable to class \"%s\".",
                subject.getSubjectCode(), subject.getSubjectName(), formatClassName(classEntity)
            ));
        }

        Optional<TeacherSubjectAssignment> existingOpt = teacherSubjectAssignmentRepository
            .findByTeacherTeacherIdAndSubjectIdAndClassEntityId(teacherId, subjectId, classId);

        if (existingOpt.isPresent()) {
            TeacherSubjectAssignment existing = existingOpt.get();
            if (existing.isActive()) {
                throw new IllegalArgumentException(String.format(
                    "\"%s\" already teaches \"%s - %s\" for \"%s\".",
                    teacher.getName(), subject.getSubjectCode(), subject.getSubjectName(), formatClassName(classEntity)
                ));
            } else {
                existing.setActive(active);
                ensureTeacherClassAssignment(teacher, classEntity);
                return toSubjectResponse(teacherSubjectAssignmentRepository.save(existing));
            }
        }

        TeacherSubjectAssignment assignment = new TeacherSubjectAssignment(teacher, subject, classEntity);
        assignment.setActive(active);
        TeacherSubjectAssignment saved = teacherSubjectAssignmentRepository.save(assignment);
        ensureTeacherClassAssignment(teacher, classEntity);
        return toSubjectResponse(saved);
    }

    public BulkTeacherSubjectAssignmentResponse createBulkSubjectAssignments(BulkTeacherSubjectAssignmentRequest request) {
        Teacher teacher = teacherRepository.findById(request.teacherId())
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + request.teacherId()));
        Subject subject = subjectRepository.findById(request.subjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.subjectId()));

        int added = 0;
        int alreadyExisted = 0;
        int failed = 0;
        List<BulkTeacherSubjectAssignmentResponse.ClassAssignmentResult> results = new ArrayList<>();

        for (Long classId : request.classIds()) {
            Optional<ClassEntity> classOpt = classEntityRepository.findById(classId);
            if (classOpt.isEmpty()) {
                failed++;
                results.add(new BulkTeacherSubjectAssignmentResponse.ClassAssignmentResult(
                    classId, "UNKNOWN", "Class #" + classId, "FAILED", "Class not found with id: " + classId
                ));
                continue;
            }

            ClassEntity classEntity = classOpt.get();
            String className = formatClassName(classEntity);

            if (!isSubjectApplicableToClass(subject, classEntity)) {
                failed++;
                results.add(new BulkTeacherSubjectAssignmentResponse.ClassAssignmentResult(
                    classId, classEntity.getClassCode(), className, "FAILED",
                    String.format("Subject \"%s - %s\" is not applicable to class \"%s\".",
                        subject.getSubjectCode(), subject.getSubjectName(), className)
                ));
                continue;
            }

            Optional<TeacherSubjectAssignment> existingOpt = teacherSubjectAssignmentRepository
                .findByTeacherTeacherIdAndSubjectIdAndClassEntityId(teacher.getTeacherId(), subject.getId(), classEntity.getId());

            if (existingOpt.isPresent()) {
                TeacherSubjectAssignment existing = existingOpt.get();
                if (existing.isActive()) {
                    alreadyExisted++;
                    results.add(new BulkTeacherSubjectAssignmentResponse.ClassAssignmentResult(
                        classId, classEntity.getClassCode(), className, "ALREADY_EXISTS",
                        String.format("\"%s\" already teaches \"%s - %s\" for \"%s\".",
                            teacher.getName(), subject.getSubjectCode(), subject.getSubjectName(), className)
                    ));
                    continue;
                } else {
                    existing.setActive(request.active());
                    teacherSubjectAssignmentRepository.save(existing);
                    ensureTeacherClassAssignment(teacher, classEntity);
                    added++;
                    results.add(new BulkTeacherSubjectAssignmentResponse.ClassAssignmentResult(
                        classId, classEntity.getClassCode(), className, "ADDED",
                        String.format("Reactivated assignment for \"%s\".", className)
                    ));
                    continue;
                }
            }

            TeacherSubjectAssignment assignment = new TeacherSubjectAssignment(teacher, subject, classEntity);
            assignment.setActive(request.active());
            teacherSubjectAssignmentRepository.save(assignment);
            ensureTeacherClassAssignment(teacher, classEntity);

            added++;
            results.add(new BulkTeacherSubjectAssignmentResponse.ClassAssignmentResult(
                classId, classEntity.getClassCode(), className, "ADDED",
                String.format("Assigned \"%s - %s\" to \"%s\".", subject.getSubjectCode(), subject.getSubjectName(), className)
            ));
        }

        return new BulkTeacherSubjectAssignmentResponse(added, alreadyExisted, failed, results);
    }

    public TeacherSubjectAssignmentResponse toggleSubjectAssignmentActive(Long id) {
        TeacherSubjectAssignment assignment = teacherSubjectAssignmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher subject assignment not found with id: " + id));
        assignment.setActive(!assignment.isActive());
        if (assignment.isActive()) {
            ensureTeacherClassAssignment(assignment.getTeacher(), assignment.getClassEntity());
        }
        return toSubjectResponse(teacherSubjectAssignmentRepository.save(assignment));
    }

    public void deleteSubjectAssignment(Long id) {
        TeacherSubjectAssignment assignment = teacherSubjectAssignmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher subject assignment not found with id: " + id));

        if (timetableSlotRepository.existsByTeacherTeacherIdAndSubjectIdAndClassEntityId(
                assignment.getTeacher().getTeacherId(),
                assignment.getSubject().getId(),
                assignment.getClassEntity().getId())) {
            throw new IllegalStateException(String.format(
                "Cannot delete assignment because it is used by an existing timetable slot for \"%s - %s\". Deactivate the assignment instead.",
                assignment.getSubject().getSubjectCode(), assignment.getSubject().getSubjectName()
            ));
        }

        teacherSubjectAssignmentRepository.deleteById(id);
    }

    public void deleteAll() {
        teacherSubjectAssignmentRepository.deleteAll();
        teacherClassAssignmentRepository.deleteAll();
    }

    public String formatClassName(ClassEntity c) {
        if (c == null) return "Unknown Class";
        StringBuilder sb = new StringBuilder(c.getClassName() != null ? c.getClassName() : "Class #" + c.getId());
        if (c.getSection() != null && !c.getSection().isBlank() && !sb.toString().contains(c.getSection())) {
            sb.append(" ").append(c.getSection());
        }
        return sb.toString();
    }

    private TeacherClassAssignmentResponse toClassResponse(TeacherClassAssignment assignment) {
        ClassEntity c = assignment.getClassEntity();
        return new TeacherClassAssignmentResponse(
            assignment.getId(),
            assignment.getTeacher() != null ? assignment.getTeacher().getTeacherId() : null,
            c != null ? c.getId() : null,
            c != null ? formatClassName(c) : null,
            c != null ? c.getClassCode() : null,
            c != null ? c.getSection() : null,
            c != null ? c.getYearLevel() : null,
            assignment.isActive(),
            assignment.getCreatedAt(),
            assignment.getUpdatedAt()
        );
    }

    private TeacherSubjectAssignmentResponse toSubjectResponse(TeacherSubjectAssignment assignment) {
        Subject s = assignment.getSubject();
        ClassEntity c = assignment.getClassEntity();
        Teacher t = assignment.getTeacher();
        Department d = c != null && c.getDepartment() != null ? c.getDepartment() : (s != null ? s.getDepartment() : null);

        return new TeacherSubjectAssignmentResponse(
            assignment.getId(),
            t != null ? t.getTeacherId() : null,
            t != null ? t.getName() : null,
            s != null ? s.getId() : null,
            s != null ? s.getSubjectName() : null,
            s != null ? s.getSubjectCode() : null,
            s != null ? s.getCredits() : null,
            c != null ? c.getId() : null,
            c != null ? formatClassName(c) : null,
            c != null ? c.getClassCode() : null,
            d != null ? d.getId() : null,
            d != null ? d.getName() : null,
            d != null ? d.getDepartmentCode() : null,
            assignment.isActive(),
            assignment.getCreatedAt(),
            assignment.getUpdatedAt()
        );
    }
}
