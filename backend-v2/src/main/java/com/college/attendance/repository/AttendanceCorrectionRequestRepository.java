package com.college.attendance.repository;

import com.college.attendance.model.AttendanceCorrectionRequest;
import com.college.attendance.model.CorrectionRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceCorrectionRequestRepository extends JpaRepository<AttendanceCorrectionRequest, Long> {
    List<AttendanceCorrectionRequest> findByTeacherTeacherId(String teacherId);
    List<AttendanceCorrectionRequest> findByStatus(CorrectionRequestStatus status);
    List<AttendanceCorrectionRequest> findByAttendanceSessionId(Long sessionId);
}
