package com.college.attendance.repository;

import com.college.attendance.model.TeacherClassAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherClassAssignmentRepository extends JpaRepository<TeacherClassAssignment, Long> {
    List<TeacherClassAssignment> findByTeacherTeacherId(String teacherId);
    List<TeacherClassAssignment> findByClassEntityId(Long classId);
    List<TeacherClassAssignment> findByTeacherTeacherIdAndActiveTrue(String teacherId);
    Optional<TeacherClassAssignment> findByTeacherTeacherIdAndClassEntityId(String teacherId, Long classId);
    boolean existsByTeacherTeacherIdAndClassEntityId(String teacherId, Long classId);
}
