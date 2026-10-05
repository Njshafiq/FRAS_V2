package com.college.attendance.model;

import jakarta.persistence.*;
import java.util.Set;

@Entity
@Table(name = "subjects")
public class Subject extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "subject_code", length = 50, nullable = false, unique = true)
    private String subjectCode;

    @Column(name = "subject_name", length = 100, nullable = false)
    private String subjectName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", foreignKey = @ForeignKey(name = "fk_subjects_departments"))
    private Department department;

    @Column(name = "year_level")
    private Integer yearLevel;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "credits")
    private Integer credits;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "subject", fetch = FetchType.LAZY)
    private Set<TimetableSlot> timetableSlots;

    @OneToMany(mappedBy = "subject", fetch = FetchType.LAZY)
    private Set<AttendanceSession> attendanceSessions;

    public Subject() {
    }

    public Subject(String subjectCode, String subjectName, Department department, Integer yearLevel, Integer credits) {
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.department = department;
        this.yearLevel = yearLevel;
        this.credits = credits;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Integer getYearLevel() {
        return yearLevel;
    }

    public void setYearLevel(Integer yearLevel) {
        this.yearLevel = yearLevel;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<TimetableSlot> getTimetableSlots() {
        return timetableSlots;
    }

    public void setTimetableSlots(Set<TimetableSlot> timetableSlots) {
        this.timetableSlots = timetableSlots;
    }

    public Set<AttendanceSession> getAttendanceSessions() {
        return attendanceSessions;
    }

    public void setAttendanceSessions(Set<AttendanceSession> attendanceSessions) {
        this.attendanceSessions = attendanceSessions;
    }
}
