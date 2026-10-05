package com.college.attendance.model;

import jakarta.persistence.*;

@Entity
@Table(name = "curriculums", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"regulation", "department_id", "semester", "subject_id"})
})
public class Curriculum extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "regulation", length = 50, nullable = false)
    private String regulation; // e.g. "R2021"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false, foreignKey = @ForeignKey(name = "fk_curriculum_departments"))
    private Department department;

    @Column(name = "semester", nullable = false)
    private Integer semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false, foreignKey = @ForeignKey(name = "fk_curriculum_subjects"))
    private Subject subject;

    @Column(name = "credits", nullable = false)
    private Integer credits;

    @Column(name = "course_type", length = 50, nullable = false)
    private String courseType; // "THEORY", "LAB", "CORE", "ELECTIVE"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", foreignKey = @ForeignKey(name = "fk_curriculum_academic_years"))
    private AcademicYear academicYear;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Curriculum() {
    }

    public Curriculum(String regulation, Department department, Integer semester, Subject subject, Integer credits, String courseType) {
        this.regulation = regulation;
        this.department = department;
        this.semester = semester;
        this.subject = subject;
        this.credits = credits;
        this.courseType = courseType;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRegulation() {
        return regulation;
    }

    public void setRegulation(String regulation) {
        this.regulation = regulation;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public String getCourseType() {
        return courseType;
    }

    public void setCourseType(String courseType) {
        this.courseType = courseType;
    }

    public AcademicYear getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(AcademicYear academicYear) {
        this.academicYear = academicYear;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
