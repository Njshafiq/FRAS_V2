package com.college.attendance.service;

import com.college.attendance.dto.SubjectRequest;
import com.college.attendance.dto.SubjectResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.Curriculum;
import com.college.attendance.model.Department;
import com.college.attendance.model.Subject;
import com.college.attendance.repository.CurriculumRepository;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.SubjectRepository;
import com.college.attendance.repository.TeacherSubjectAssignmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;
    private final CurriculumRepository curriculumRepository;

    public SubjectService(SubjectRepository subjectRepository,
                          DepartmentRepository departmentRepository,
                          TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository,
                          CurriculumRepository curriculumRepository) {
        this.subjectRepository = subjectRepository;
        this.departmentRepository = departmentRepository;
        this.teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
        this.curriculumRepository = curriculumRepository;
    }

    public List<SubjectResponse> getAll() {
        return subjectRepository.findAll().stream().map(this::toResponse).toList();
    }

    public SubjectResponse getById(Long id) {
        Subject subject = subjectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        return toResponse(subject);
    }

    public SubjectResponse create(SubjectRequest request) {
        if (subjectRepository.existsBySubjectCode(request.subjectCode())) {
            throw new IllegalArgumentException("Subject code already exists: " + request.subjectCode());
        }

        Department department = null;
        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));
        }

        Subject subject = new Subject(request.subjectCode(), request.subjectName(), department, request.yearLevel(), request.credits());
        subject.setSemester(request.semester());
        subject.setActive(request.active());
        return toResponse(subjectRepository.save(subject));
    }

    public SubjectResponse update(Long id, SubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        Department department = null;
        if (request.departmentId() != null) {
            department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));
        }

        if (!subject.getSubjectCode().equalsIgnoreCase(request.subjectCode()) &&
            subjectRepository.existsBySubjectCode(request.subjectCode())) {
            throw new IllegalArgumentException("Subject code already exists: " + request.subjectCode());
        }

        subject.setSubjectCode(request.subjectCode());
        subject.setSubjectName(request.subjectName());
        subject.setDepartment(department);
        subject.setYearLevel(request.yearLevel());
        subject.setSemester(request.semester());
        subject.setCredits(request.credits());
        subject.setActive(request.active());
        return toResponse(subjectRepository.save(subject));
    }

    public void delete(Long id) {
        Subject subject = subjectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        long assignmentCount = teacherSubjectAssignmentRepository.countBySubjectIdAndActiveTrue(id);
        if (assignmentCount > 0) {
            throw new IllegalStateException(String.format(
                "Cannot delete subject \"%s - %s\". It is currently used by %d class assignments. Deactivate/remove the dependent records first.",
                subject.getSubjectCode(), subject.getSubjectName(), assignmentCount
            ));
        }

        long curriculumCount = curriculumRepository.findBySubjectId(id).stream().filter(Curriculum::isActive).count();
        if (curriculumCount > 0) {
            throw new IllegalStateException(String.format(
                "Cannot delete subject \"%s - %s\". It is currently mapped to %d department curriculum entries. Deactivate/remove the dependent records first.",
                subject.getSubjectCode(), subject.getSubjectName(), curriculumCount
            ));
        }

        subject.setActive(false);
        subjectRepository.save(subject);
    }

    private SubjectResponse toResponse(Subject subject) {
        return new SubjectResponse(
            subject.getId(),
            subject.getSubjectCode(),
            subject.getSubjectName(),
            subject.getDepartment() != null ? subject.getDepartment().getId() : null,
            subject.getYearLevel(),
            subject.getSemester(),
            subject.getCredits(),
            subject.isActive(),
            subject.getCreatedAt(),
            subject.getUpdatedAt()
        );
    }
}
