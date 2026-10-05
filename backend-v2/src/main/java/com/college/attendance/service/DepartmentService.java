package com.college.attendance.service;

import com.college.attendance.dto.DepartmentRequest;
import com.college.attendance.dto.DepartmentResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.Department;
import com.college.attendance.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    public DepartmentResponse create(DepartmentRequest request) {
        if (departmentRepository.existsByDepartmentCode(request.departmentCode())) {
            throw new IllegalArgumentException("Department code already exists: " + request.departmentCode());
        }

        Department department = new Department(request.departmentCode(), request.name());
        department.setActive(request.active());
        return toResponse(departmentRepository.save(department));
    }

    public DepartmentResponse getById(Long id) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return toResponse(department);
    }

    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        if (!department.getDepartmentCode().equalsIgnoreCase(request.departmentCode()) &&
            departmentRepository.existsByDepartmentCode(request.departmentCode())) {
            throw new IllegalArgumentException("Department code already exists: " + request.departmentCode());
        }

        department.setDepartmentCode(request.departmentCode());
        department.setName(request.name());
        department.setActive(request.active());
        return toResponse(departmentRepository.save(department));
    }

    public void delete(Long id) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        department.setActive(false);
        departmentRepository.save(department);
    }

    private DepartmentResponse toResponse(Department department) {
        return new DepartmentResponse(
            department.getId(),
            department.getDepartmentCode(),
            department.getName(),
            department.isActive(),
            department.getCreatedAt(),
            department.getUpdatedAt()
        );
    }
}
