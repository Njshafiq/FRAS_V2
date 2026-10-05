package com.college.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Entity
@Table(name = "attendance_sessions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"timetable_slot_id", "session_date"})
})
public class AttendanceSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timetable_slot_id", nullable = false, foreignKey = @ForeignKey(name = "fk_attendance_sessions_timetable"))
    private TimetableSlot timetableSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false, foreignKey = @ForeignKey(name = "fk_attendance_sessions_classes"))
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false, foreignKey = @ForeignKey(name = "fk_attendance_sessions_subjects"))
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false, foreignKey = @ForeignKey(name = "fk_attendance_sessions_teachers"))
    private Teacher teacher;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private AttendanceSessionStatus status = AttendanceSessionStatus.SCHEDULED;

    @Column(name = "present_count", nullable = false)
    private int presentCount = 0;

    @Column(name = "absent_count", nullable = false)
    private int absentCount = 0;

    @Column(name = "late_count", nullable = false)
    private int lateCount = 0;

    @Column(name = "total_students", nullable = false)
    private int totalStudents = 0;

    @OneToMany(mappedBy = "attendanceSession", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<AttendanceRecord> attendanceRecords;

    public AttendanceSession() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TimetableSlot getTimetableSlot() {
        return timetableSlot;
    }

    public void setTimetableSlot(TimetableSlot timetableSlot) {
        this.timetableSlot = timetableSlot;
    }

    public ClassEntity getClassEntity() {
        return classEntity;
    }

    public void setClassEntity(ClassEntity classEntity) {
        this.classEntity = classEntity;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public AttendanceSessionStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceSessionStatus status) {
        this.status = status;
    }

    public int getPresentCount() {
        return presentCount;
    }

    public void setPresentCount(int presentCount) {
        this.presentCount = presentCount;
    }

    public int getAbsentCount() {
        return absentCount;
    }

    public void setAbsentCount(int absentCount) {
        this.absentCount = absentCount;
    }

    public int getLateCount() {
        return lateCount;
    }

    public void setLateCount(int lateCount) {
        this.lateCount = lateCount;
    }

    public int getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(int totalStudents) {
        this.totalStudents = totalStudents;
    }

    public Set<AttendanceRecord> getAttendanceRecords() {
        return attendanceRecords;
    }

    public void setAttendanceRecords(Set<AttendanceRecord> attendanceRecords) {
        this.attendanceRecords = attendanceRecords;
    }

    public double getAttendancePercentage() {
        if (totalStudents == 0) return 0.0;
        return Math.round((presentCount * 100.0 / totalStudents) * 10.0) / 10.0;
    }
}
