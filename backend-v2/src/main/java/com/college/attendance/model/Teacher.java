package com.college.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "teachers")
public class Teacher extends BaseEntity {

    @Id
    @Column(name = "teacher_id", length = 50, nullable = false)
    private String teacherId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_teachers_users"))
    private User user;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "email", length = 100)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false, foreignKey = @ForeignKey(name = "fk_teachers_departments"))
    private Department department;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "teacher", fetch = FetchType.LAZY)
    private Set<TeacherClassAssignment> teacherClassAssignments;

    @OneToMany(mappedBy = "teacher", fetch = FetchType.LAZY)
    private Set<TimetableSlot> timetableSlots;

    public Teacher() {
    }

    public Teacher(String teacherId, String name, Department department) {
        this.teacherId = teacherId;
        this.name = name;
        this.department = department;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<TeacherClassAssignment> getTeacherClassAssignments() {
        return teacherClassAssignments;
    }

    public void setTeacherClassAssignments(Set<TeacherClassAssignment> teacherClassAssignments) {
        this.teacherClassAssignments = teacherClassAssignments;
    }

    public Set<TimetableSlot> getTimetableSlots() {
        return timetableSlots;
    }

    public void setTimetableSlots(Set<TimetableSlot> timetableSlots) {
        this.timetableSlots = timetableSlots;
    }
}
