package com.college.attendance.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teacher_subject_assignments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"teacher_id", "subject_id", "class_id"})
})
public class TeacherSubjectAssignment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false, foreignKey = @ForeignKey(name = "fk_teacher_subject_teachers"))
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false, foreignKey = @ForeignKey(name = "fk_teacher_subject_subjects"))
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false, foreignKey = @ForeignKey(name = "fk_teacher_subject_classes"))
    private ClassEntity classEntity;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public TeacherSubjectAssignment() {
    }

    public TeacherSubjectAssignment(Teacher teacher, Subject subject, ClassEntity classEntity) {
        this.teacher = teacher;
        this.subject = subject;
        this.classEntity = classEntity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public ClassEntity getClassEntity() {
        return classEntity;
    }

    public void setClassEntity(ClassEntity classEntity) {
        this.classEntity = classEntity;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
