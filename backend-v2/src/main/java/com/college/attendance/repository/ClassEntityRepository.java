package com.college.attendance.repository;

import com.college.attendance.model.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassEntityRepository extends JpaRepository<ClassEntity, Long> {
    Optional<ClassEntity> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);
    List<ClassEntity> findByAcademicYearIdAndDepartmentId(Long academicYearId, Long departmentId);
    List<ClassEntity> findByYearLevel(Integer yearLevel);
}
