package com.college.attendance.repository;

import com.college.attendance.model.FaceSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaceSampleRepository extends JpaRepository<FaceSample, Long> {
    List<FaceSample> findByFaceDataId(Long faceDataId);
    List<FaceSample> findByFaceDataStudentStudentId(String studentId);
}
