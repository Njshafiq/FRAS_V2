package com.college.attendance.service;

import com.college.attendance.dto.ClassRequest;
import com.college.attendance.dto.ClassResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Department;
import com.college.attendance.repository.AcademicYearRepository;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClassService {

    private final ClassEntityRepository classEntityRepository;
    private final AcademicYearRepository academicYearRepository;
    private final DepartmentRepository departmentRepository;

    public ClassService(ClassEntityRepository classEntityRepository,
                       AcademicYearRepository academicYearRepository,
                       DepartmentRepository departmentRepository) {
        this.classEntityRepository = classEntityRepository;
        this.academicYearRepository = academicYearRepository;
        this.departmentRepository = departmentRepository;
    }

    public List<ClassResponse> getAll() {
        return classEntityRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ClassResponse getById(Long id) {
        ClassEntity classEntity = classEntityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        return toResponse(classEntity);
    }

    public ClassResponse create(ClassRequest request) {
        AcademicYear academicYear = academicYearRepository.findById(request.academicYearId())
            .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + request.academicYearId()));
        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));

        if (classEntityRepository.existsByClassCode(request.classCode())) {
            throw new IllegalArgumentException("Class code already exists: " + request.classCode());
        }

        ClassEntity classEntity = new ClassEntity(request.className(), request.classCode(), academicYear, department, request.yearLevel());
        classEntity.setSection(request.section());
        classEntity.setActive(request.active());
        return toResponse(classEntityRepository.save(classEntity));
    }

    public ClassResponse update(Long id, ClassRequest request) {
        ClassEntity classEntity = classEntityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));

        AcademicYear academicYear = academicYearRepository.findById(request.academicYearId())
            .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + request.academicYearId()));
        Department department = departmentRepository.findById(request.departmentId())
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.departmentId()));

        if (!classEntity.getClassCode().equalsIgnoreCase(request.classCode()) &&
            classEntityRepository.existsByClassCode(request.classCode())) {
            throw new IllegalArgumentException("Class code already exists: " + request.classCode());
        }

        classEntity.setClassName(request.className());
        classEntity.setClassCode(request.classCode());
        classEntity.setAcademicYear(academicYear);
        classEntity.setDepartment(department);
        classEntity.setYearLevel(request.yearLevel());
        classEntity.setSection(request.section());
        classEntity.setActive(request.active());
        return toResponse(classEntityRepository.save(classEntity));
    }

    public void delete(Long id) {
        ClassEntity classEntity = classEntityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        classEntity.setActive(false);
        classEntityRepository.save(classEntity);
    }

    private ClassResponse toResponse(ClassEntity classEntity) {
        return new ClassResponse(
            classEntity.getId(),
            classEntity.getClassName(),
            classEntity.getClassCode(),
            classEntity.getAcademicYear() != null ? classEntity.getAcademicYear().getId() : null,
            classEntity.getDepartment() != null ? classEntity.getDepartment().getId() : null,
            classEntity.getYearLevel(),
            classEntity.getSection(),
            classEntity.isActive(),
            classEntity.getCreatedAt(),
            classEntity.getUpdatedAt()
        );
    }
}
