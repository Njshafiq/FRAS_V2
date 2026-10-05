package com.college.attendance.repository;

import com.college.attendance.model.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, Long> {
    List<TimetableSlot> findByClassEntityId(Long classId);
    List<TimetableSlot> findByTeacherTeacherId(String teacherId);
    List<TimetableSlot> findByDayOfWeek(String dayOfWeek);
    List<TimetableSlot> findByClassEntityIdAndDayOfWeek(Long classId, String dayOfWeek);
    List<TimetableSlot> findByTeacherTeacherIdAndDayOfWeek(String teacherId, String dayOfWeek);
    List<TimetableSlot> findByClassEntityIdAndDayOfWeekOrderByStartTime(Long classId, String dayOfWeek);
    boolean existsByTeacherTeacherIdAndSubjectIdAndClassEntityId(String teacherId, Long subjectId, Long classId);
}
