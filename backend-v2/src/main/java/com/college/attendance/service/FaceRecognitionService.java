package com.college.attendance.service;

import com.college.attendance.dto.FaceRecognitionResult;
import com.college.attendance.dto.ImageRecognitionResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FaceRecognitionService {

    private final RestClient restClient;
    private final String baseUrl;
    private final FaceDataService faceDataService;

    public FaceRecognitionService(@Value("${ai.service.base-url:http://localhost:8000}") String baseUrl,
                                 FaceDataService faceDataService) {
        this.baseUrl = baseUrl;
        this.faceDataService = faceDataService;
        org.springframework.http.client.SimpleClientHttpRequestFactory requestFactory =
            new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(30000);
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .requestFactory(requestFactory)
            .build();
    }

    public FaceRecognitionResult recognizeFace(String studentId, String embeddingData) {
        if (embeddingData == null || embeddingData.isBlank()) {
            return new FaceRecognitionResult(false, null, "Embedding data is required for recognition.", "FaceNet512");
        }

        if (baseUrl == null || baseUrl.isBlank()) {
            return new FaceRecognitionResult(
                false,
                null,
                "DeepFace + FaceNet512 service base URL is not configured.",
                "FaceNet512"
            );
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("studentId", studentId);
            payload.put("modelVersion", "FaceNet512");
            payload.put("embeddingData", embeddingData);

            Map<String, Object> response = restClient.post()
                .uri("/recognize")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(Map.class);

            if (response == null) {
                return new FaceRecognitionResult(false, null, "DeepFace recognition service returned an empty response.", "FaceNet512");
            }

            Object successful = response.get("successful");
            Object confidence = response.get("confidenceScore");
            Object message = response.get("message");

            return new FaceRecognitionResult(
                successful != null && Boolean.parseBoolean(successful.toString()),
                confidence instanceof Number number ? number.doubleValue() : null,
                message != null ? message.toString() : "Recognition completed.",
                "FaceNet512"
            );
        } catch (ResourceAccessException ex) {
            return new FaceRecognitionResult(false, null, "DeepFace + FaceNet512 service unavailable: " + ex.getMessage(), "FaceNet512");
        } catch (Exception ex) {
            return new FaceRecognitionResult(false, null, "DeepFace recognition failed: " + ex.getMessage(), "FaceNet512");
        }
    }

    public ImageRecognitionResult recognizeImages(List<String> frames) {
        if (frames == null || frames.size() < 3 || frames.size() > 5) {
            return new ImageRecognitionResult(false, null, null, "Recognition requires 3 to 5 camera frames.", "FaceNet512");
        }
        List<Map<String, Object>> enrolledFaces = faceDataService.getRecognitionCandidates();
        if (enrolledFaces.isEmpty()) {
            return new ImageRecognitionResult(false, null, null, "No students have valid face enrollment.", "FaceNet512");
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("frames", frames);
            payload.put("enrolled_faces", enrolledFaces);
            payload.put("quorum", 3);
            payload.put("threshold", 0.40);

            Map<?, ?> response = restClient.post()
                .uri("/api/face/recognize-multi-frame")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(Map.class);

            if (response == null || !Boolean.parseBoolean(String.valueOf(response.get("success")))) {
                Object message = response != null ? response.get("message") : null;
                return new ImageRecognitionResult(false, null, null,
                    message != null ? message.toString() : "Face recognition returned no result.", "FaceNet512");
            }
            Object studentId = response.get("recognized_student_id");
            Object confidence = response.get("confidence");
            if (studentId == null || !(confidence instanceof Number number)) {
                return new ImageRecognitionResult(false, null, null, "Face recognition response was incomplete.", "FaceNet512");
            }
            return new ImageRecognitionResult(true, studentId.toString(), number.doubleValue(), "Face verified.", "FaceNet512");
        } catch (Exception ex) {
            return new ImageRecognitionResult(false, null, null, "Face recognition service is unavailable.", "FaceNet512");
        }
    }
}
