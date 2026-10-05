package com.college.attendance.model;

import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(name = "departments")
public class Department extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "department_code", length = 50, nullable = false, unique = true)
    private String departmentCode;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private Set<ClassEntity> classes;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private Set<Teacher> teachers;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    private Set<Subject> subjects;

    public Department() {
    }

    public Department(String departmentCode, String name) {
        this.departmentCode = departmentCode;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<ClassEntity> getClasses() {
        return classes;
    }

    public void setClasses(Set<ClassEntity> classes) {
        this.classes = classes;
    }

    public Set<Teacher> getTeachers() {
        return teachers;
    }

    public void setTeachers(Set<Teacher> teachers) {
        this.teachers = teachers;
    }

    public Set<Subject> getSubjects() {
        return subjects;
    }

    public void setSubjects(Set<Subject> subjects) {
        this.subjects = subjects;
    }
}
