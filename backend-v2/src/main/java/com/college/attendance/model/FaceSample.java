package com.college.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "face_samples")
public class FaceSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "face_data_id", nullable = false, foreignKey = @ForeignKey(name = "fk_face_samples_face_data"))
    private FaceData faceData;

    @Column(name = "image_path", columnDefinition = "TEXT")
    private String imagePath;

    @Column(name = "sample_index")
    private Integer sampleIndex;

    @Column(name = "captured_at", nullable = false)
    private LocalDateTime capturedAt = LocalDateTime.now();

    public FaceSample() {
    }

    public FaceSample(FaceData faceData, String imagePath, Integer sampleIndex) {
        this.faceData = faceData;
        this.imagePath = imagePath;
        this.sampleIndex = sampleIndex;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public FaceData getFaceData() {
        return faceData;
    }

    public void setFaceData(FaceData faceData) {
        this.faceData = faceData;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Integer getSampleIndex() {
        return sampleIndex;
    }

    public void setSampleIndex(Integer sampleIndex) {
        this.sampleIndex = sampleIndex;
    }

    public LocalDateTime getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(LocalDateTime capturedAt) {
        this.capturedAt = capturedAt;
    }
}
