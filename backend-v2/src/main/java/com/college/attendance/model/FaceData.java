package com.college.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "face_data")
public class FaceData extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false, unique = true, foreignKey = @ForeignKey(name = "fk_face_data_students"))
    private Student student;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Column(name = "embedding_data", columnDefinition = "TEXT")
    private String embeddingData;

    @Enumerated(EnumType.STRING)
    @Column(name = "registration_status", length = 20, nullable = false)
    private FaceRegistrationStatus registrationStatus = FaceRegistrationStatus.NOT_REGISTERED;

    @Enumerated(EnumType.STRING)
    @Column(name = "face_status", length = 20, nullable = false)
    private FaceStatus faceStatus = FaceStatus.NOT_REGISTERED;

    @Column(name = "registration_timestamp")
    private LocalDateTime registrationTimestamp;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "faceData", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<FaceSample> faceSamples;

    public FaceData() {
    }

    public FaceData(Student student) {
        this.student = student;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public String getEmbeddingData() {
        return embeddingData;
    }

    public void setEmbeddingData(String embeddingData) {
        this.embeddingData = embeddingData;
    }

    public FaceRegistrationStatus getRegistrationStatus() {
        return registrationStatus;
    }

    public void setRegistrationStatus(FaceRegistrationStatus registrationStatus) {
        this.registrationStatus = registrationStatus;
    }

    public FaceStatus getFaceStatus() {
        return faceStatus;
    }

    public void setFaceStatus(FaceStatus faceStatus) {
        this.faceStatus = faceStatus;
    }

    public LocalDateTime getRegistrationTimestamp() {
        return registrationTimestamp;
    }

    public void setRegistrationTimestamp(LocalDateTime registrationTimestamp) {
        this.registrationTimestamp = registrationTimestamp;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<FaceSample> getFaceSamples() {
        return faceSamples;
    }

    public void setFaceSamples(Set<FaceSample> faceSamples) {
        this.faceSamples = faceSamples;
    }
}
