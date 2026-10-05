package com.college.attendance.repository;

import com.college.attendance.model.AttendanceSession;
import com.college.attendance.model.AttendanceSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByTeacherTeacherId(String teacherId);
    List<AttendanceSession> findByClassEntityId(Long classId);
    List<AttendanceSession> findBySessionDate(LocalDate sessionDate);
    List<AttendanceSession> findBySessionDateAndClassEntityId(LocalDate sessionDate, Long classId);
    List<AttendanceSession> findByTeacherTeacherIdAndSessionDate(String teacherId, LocalDate sessionDate);
    List<AttendanceSession> findByTeacherTeacherIdAndClassEntityId(String teacherId, Long classId);
    List<AttendanceSession> findByTeacherTeacherIdAndSubjectId(String teacherId, Long subjectId);
    List<AttendanceSession> findByStatus(AttendanceSessionStatus status);
    boolean existsByTimetableSlotIdAndSessionDate(Long timetableSlotId, LocalDate sessionDate);
    java.util.Optional<AttendanceSession> findFirstByTimetableSlotIdAndSessionDate(Long timetableSlotId, LocalDate sessionDate);
}
