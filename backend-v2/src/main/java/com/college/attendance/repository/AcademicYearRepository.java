package com.college.attendance.repository;

import com.college.attendance.model.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    Optional<AcademicYear> findByYearName(String yearName);
    boolean existsByYearName(String yearName);
    Optional<AcademicYear> findByActiveTrue();
}
