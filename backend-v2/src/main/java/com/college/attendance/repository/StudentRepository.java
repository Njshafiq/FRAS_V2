package com.college.attendance.repository;

import com.college.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    Optional<Student> findByRegisterNumber(String registerNumber);
    boolean existsByRegisterNumber(String registerNumber);
    boolean existsByStudentId(String studentId);

    List<Student> findByClassEntityId(Long classId);

    List<Student> findByAcademicYearId(Long academicYearId);

    @Query("SELECT s FROM Student s WHERE s.classEntity.id = :classId AND s.active = true")
    List<Student> findActiveStudentsByClass(@Param("classId") Long classId);

    @Query("SELECT s FROM Student s WHERE s.classEntity.id = :classId AND s.active = true ORDER BY s.name")
    List<Student> findActiveStudentsByClassOrderedByName(@Param("classId") Long classId);
}
