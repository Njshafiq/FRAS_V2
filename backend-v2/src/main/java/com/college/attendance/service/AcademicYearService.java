package com.college.attendance.service;

import com.college.attendance.dto.AcademicYearRequest;
import com.college.attendance.dto.AcademicYearResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.AcademicYear;
import com.college.attendance.repository.AcademicYearRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    public AcademicYearService(AcademicYearRepository academicYearRepository) {
        this.academicYearRepository = academicYearRepository;
    }

    public List<AcademicYearResponse> getAll() {
        return academicYearRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    public AcademicYearResponse create(AcademicYearRequest request) {
        if (academicYearRepository.existsByYearName(request.yearName())) {
            throw new IllegalArgumentException("Academic year already exists: " + request.yearName());
        }

        AcademicYear academicYear = new AcademicYear(request.yearName(), request.startDate(), request.endDate());
        academicYear.setActive(request.active());
        return toResponse(academicYearRepository.save(academicYear));
    }

    public AcademicYearResponse getById(Long id) {
        AcademicYear academicYear = academicYearRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + id));
        return toResponse(academicYear);
    }

    public AcademicYearResponse getActive() {
        AcademicYear academicYear = academicYearRepository.findByActiveTrue()
            .orElseThrow(() -> new ResourceNotFoundException("No active academic year found"));
        return toResponse(academicYear);
    }

    public AcademicYearResponse setActive(Long id) {
        AcademicYear target = academicYearRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + id));

        List<AcademicYear> allYears = academicYearRepository.findAll();
        for (AcademicYear y : allYears) {
            y.setActive(y.getId().equals(id));
            academicYearRepository.save(y);
        }
        return toResponse(target);
    }

    public AcademicYearResponse update(Long id, AcademicYearRequest request) {
        AcademicYear academicYear = academicYearRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Academic year not found with id: " + id));

        if (!academicYear.getYearName().equalsIgnoreCase(request.yearName()) &&
            academicYearRepository.existsByYearName(request.yearName())) {
            throw new IllegalArgumentException("Academic year already exists: " + request.yearName());
        }

        academicYear.setYearName(request.yearName());
        academicYear.setStartDate(request.startDate());
        academicYear.setEndDate(request.endDate());
        academicYear.setActive(request.active());
        return toResponse(academicYearRepository.save(academicYear));
    }

    private AcademicYearResponse toResponse(AcademicYear academicYear) {
        return new AcademicYearResponse(
            academicYear.getId(),
            academicYear.getYearName(),
            academicYear.getStartDate(),
            academicYear.getEndDate(),
            academicYear.isActive(),
            academicYear.getCreatedAt(),
            academicYear.getUpdatedAt()
        );
    }
}
