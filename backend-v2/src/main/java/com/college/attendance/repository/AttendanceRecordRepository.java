package com.college.attendance.repository;

import com.college.attendance.model.AttendanceRecord;
import com.college.attendance.model.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByAttendanceSessionId(Long sessionId);

    Optional<AttendanceRecord> findByAttendanceSessionIdAndStudentStudentId(Long sessionId, String studentId);

    List<AttendanceRecord> findByStudentStudentId(String studentId);

    List<AttendanceRecord> findByStatus(AttendanceStatus status);

    @Query("SELECT r FROM AttendanceRecord r WHERE r.student.studentId = :studentId ORDER BY r.attendanceSession.sessionDate DESC, r.markedAt DESC")
    List<AttendanceRecord> findHistoryByStudentId(@Param("studentId") String studentId);

    @Query("SELECT r FROM AttendanceRecord r WHERE r.student.studentId = :studentId AND r.attendanceSession.subject.id = :subjectId")
    List<AttendanceRecord> findByStudentIdAndSubjectId(@Param("studentId") String studentId, @Param("subjectId") Long subjectId);

    @Query("SELECT r FROM AttendanceRecord r WHERE r.attendanceSession.sessionDate = :sessionDate AND r.student.studentId = :studentId")
    List<AttendanceRecord> findBySessionDateAndStudent(@Param("sessionDate") LocalDate sessionDate,
                                                      @Param("studentId") String studentId);

    @Query("SELECT COUNT(r) FROM AttendanceRecord r WHERE r.attendanceSession.id = :sessionId AND r.status = :status")
    long countBySessionIdAndStatus(@Param("sessionId") Long sessionId, @Param("status") AttendanceStatus status);

    boolean existsByAttendanceSessionIdAndStudentStudentId(Long sessionId, String studentId);
}
