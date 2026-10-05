package com.college.attendance.repository;

import com.college.attendance.model.FaceData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FaceDataRepository extends JpaRepository<FaceData, Long> {
    Optional<FaceData> findByStudentStudentId(String studentId);
    boolean existsByStudentStudentId(String studentId);
    java.util.List<FaceData> findByActiveTrue();

    @org.springframework.data.jpa.repository.Query("SELECT fd FROM FaceData fd WHERE fd.student.studentId IN :studentIds")
    java.util.List<FaceData> findByStudentStudentIdIn(@org.springframework.data.repository.query.Param("studentIds") java.util.Collection<String> studentIds);
}
