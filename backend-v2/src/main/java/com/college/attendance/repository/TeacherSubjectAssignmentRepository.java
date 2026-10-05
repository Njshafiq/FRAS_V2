package com.college.attendance.repository;

import com.college.attendance.model.TeacherSubjectAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherSubjectAssignmentRepository extends JpaRepository<TeacherSubjectAssignment, Long> {
    List<TeacherSubjectAssignment> findByTeacherTeacherId(String teacherId);
    List<TeacherSubjectAssignment> findByTeacherTeacherIdAndActiveTrue(String teacherId);
    List<TeacherSubjectAssignment> findByTeacherTeacherIdAndClassEntityId(String teacherId, Long classId);
    Optional<TeacherSubjectAssignment> findByTeacherTeacherIdAndSubjectIdAndClassEntityId(String teacherId, Long subjectId, Long classId);
    boolean existsByTeacherTeacherIdAndSubjectIdAndClassEntityId(String teacherId, Long subjectId, Long classId);
    List<TeacherSubjectAssignment> findByClassEntityIdAndActiveTrue(Long classId);
    long countBySubjectId(Long subjectId);
    long countBySubjectIdAndActiveTrue(Long subjectId);
}
