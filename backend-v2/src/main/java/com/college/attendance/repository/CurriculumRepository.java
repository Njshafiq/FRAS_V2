package com.college.attendance.repository;

import com.college.attendance.model.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
    List<Curriculum> findByDepartmentId(Long departmentId);
    List<Curriculum> findByRegulation(String regulation);
    List<Curriculum> findByDepartmentIdAndSemester(Long departmentId, Integer semester);
    Optional<Curriculum> findByRegulationAndDepartmentIdAndSemesterAndSubjectId(String regulation, Long departmentId, Integer semester, Long subjectId);
    boolean existsByRegulationAndDepartmentIdAndSemesterAndSubjectId(String regulation, Long departmentId, Integer semester, Long subjectId);
    boolean existsByDepartmentIdAndSubjectId(Long departmentId, Long subjectId);
    List<Curriculum> findBySubjectId(Long subjectId);
}
