package com.college.attendance.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teacher_class_assignments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"teacher_id", "class_id"})
})
public class TeacherClassAssignment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false, foreignKey = @ForeignKey(name = "fk_teacher_class_teachers"))
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false, foreignKey = @ForeignKey(name = "fk_teacher_class_classes"))
    private ClassEntity classEntity;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public TeacherClassAssignment() {
    }

    public TeacherClassAssignment(Teacher teacher, ClassEntity classEntity) {
        this.teacher = teacher;
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
