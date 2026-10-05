package com.college.attendance.model;

import jakarta.persistence.*;
import java.util.Set;

@Entity
@Table(name = "classes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"academic_year_id", "department_id", "class_name"})
})
public class ClassEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "class_name", length = 100, nullable = false)
    private String className;

    @Column(name = "class_code", length = 50, nullable = false, unique = true)
    private String classCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false, foreignKey = @ForeignKey(name = "fk_classes_academic_years"))
    private AcademicYear academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false, foreignKey = @ForeignKey(name = "fk_classes_departments"))
    private Department department;

    @Column(name = "year_level", nullable = false)
    private Integer yearLevel;

    @Column(name = "section", length = 20)
    private String section;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "classEntity", fetch = FetchType.LAZY)
    private Set<Student> students;

    @OneToMany(mappedBy = "classEntity", fetch = FetchType.LAZY)
    private Set<TimetableSlot> timetableSlots;

    @OneToMany(mappedBy = "classEntity", fetch = FetchType.LAZY)
    private Set<AttendanceSession> attendanceSessions;

    public ClassEntity() {
    }

    public ClassEntity(String className, String classCode, AcademicYear academicYear, Department department, Integer yearLevel) {
        this.className = className;
        this.classCode = classCode;
        this.academicYear = academicYear;
        this.department = department;
        this.yearLevel = yearLevel;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }

    public AcademicYear getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(AcademicYear academicYear) {
        this.academicYear = academicYear;
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

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<Student> getStudents() {
        return students;
    }

    public void setStudents(Set<Student> students) {
        this.students = students;
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
