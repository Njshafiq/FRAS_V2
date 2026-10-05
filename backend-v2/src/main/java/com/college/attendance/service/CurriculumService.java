package com.college.attendance.service;

import com.college.attendance.dto.CurriculumRequest;
import com.college.attendance.dto.CurriculumResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.Curriculum;
import com.college.attendance.model.Department;
import com.college.attendance.model.Subject;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.CurriculumRepository;
import com.college.attendance.repository.DepartmentRepository;
import com.college.attendance.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final AcademicYearRepository academicYearRepository;

    public CurriculumService(CurriculumRepository curriculumRepository,
                             DepartmentRepository departmentRepository,
                             SubjectRepository subjectRepository,
                             AcademicYearRepository academicYearRepository) {
        this.curriculumRepository = curriculumRepository;
        this.departmentRepository = departmentRepository;
        this.subjectRepository = subjectRepository;
        this.academicYearRepository = academicYearRepository;
    }

    public List<CurriculumResponse> getAll() {
        return curriculumRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CurriculumResponse getById(Long id) {
        Curriculum curriculum = curriculumRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Curriculum entry not found with id: " + id));
        return toResponse(curriculum);
    }

    public List<CurriculumResponse> getByDepartmentAndSemester(Long departmentId, Integer semester) {
        if (departmentId != null && semester != null) {
            return curriculumRepository.findByDepartmentIdAndSemester(departmentId, semester).stream().map(this::toResponse).toList();
        } else if (departmentId != null) {
            return curriculumRepository.findByDepartmentId(departmentId).stream().map(this::toResponse).toList();
        }
        return getAll();
    }

    @Transactional
    public CurriculumResponse create(CurriculumRequest request) {
        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));

        Subject subject = subjectRepository.findById(request.subjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.subjectId()));

        if (curriculumRepository.existsByRegulationAndDepartmentIdAndSemesterAndSubjectId(
            request.regulation().trim(), department.getId(), request.semester(), subject.getId())) {
            throw new IllegalArgumentException("Curriculum entry already exists for regulation " + request.regulation()
                + ", department " + department.getDepartmentCode() + ", semester " + request.semester() + " and subject " + subject.getSubjectCode());
        }

        AcademicYear academicYear = null;
        if (request.academicYearId() != null) {
            academicYear = academicYearRepository.findById(request.academicYearId())
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year not found with id: " + request.academicYearId()));
        }

        Curriculum curriculum = new Curriculum(
            request.regulation().trim(),
            department,
            request.semester(),
            subject,
            request.credits(),
            request.courseType().trim().toUpperCase()
        );
        curriculum.setAcademicYear(academicYear);
        if (request.active() != null) {
            curriculum.setActive(request.active());
        }

        return toResponse(curriculumRepository.save(curriculum));
    }

    @Transactional
    public CurriculumResponse update(Long id, CurriculumRequest request) {
        Curriculum curriculum = curriculumRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Curriculum entry not found with id: " + id));

        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));

        Subject subject = subjectRepository.findById(request.subjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.subjectId()));

        AcademicYear academicYear = null;
        if (request.academicYearId() != null) {
            academicYear = academicYearRepository.findById(request.academicYearId())
                .orElseThrow(() -> new ResourceNotFoundException("Academic Year not found with id: " + request.academicYearId()));
        }

        curriculum.setRegulation(request.regulation().trim());
        curriculum.setDepartment(department);
        curriculum.setSemester(request.semester());
        curriculum.setSubject(subject);
        curriculum.setCredits(request.credits());
        curriculum.setCourseType(request.courseType().trim().toUpperCase());
        curriculum.setAcademicYear(academicYear);
        if (request.active() != null) {
            curriculum.setActive(request.active());
        }

        return toResponse(curriculumRepository.save(curriculum));
    }

    @Transactional
    public void delete(Long id) {
        Curriculum curriculum = curriculumRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Curriculum entry not found with id: " + id));
        curriculum.setActive(false);
        curriculumRepository.save(curriculum);
    }

    private CurriculumResponse toResponse(Curriculum c) {
        return new CurriculumResponse(
            c.getId(),
            c.getRegulation(),
            c.getDepartment() != null ? c.getDepartment().getId() : null,
            c.getDepartment() != null ? c.getDepartment().getDepartmentCode() : null,
            c.getDepartment() != null ? c.getDepartment().getName() : null,
            c.getSemester(),
            c.getSubject() != null ? c.getSubject().getId() : null,
            c.getSubject() != null ? c.getSubject().getSubjectCode() : null,
            c.getSubject() != null ? c.getSubject().getSubjectName() : null,
            c.getCredits(),
            c.getCourseType(),
            c.getAcademicYear() != null ? c.getAcademicYear().getId() : null,
            c.getAcademicYear() != null ? c.getAcademicYear().getYearName() : null,
            c.isActive(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}
