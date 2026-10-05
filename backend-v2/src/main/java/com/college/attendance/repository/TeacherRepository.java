package com.college.attendance.repository;

import com.college.attendance.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Optional<Teacher> findByName(String name);
    List<Teacher> findByDepartmentId(Long departmentId);
    List<Teacher> findByActiveTrue();
}
