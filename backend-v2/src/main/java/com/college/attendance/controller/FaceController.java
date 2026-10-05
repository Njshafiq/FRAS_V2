package com.college.attendance.controller;

import com.college.attendance.dto.FaceDataResponse;
import com.college.attendance.dto.FaceEnrollmentRequest;
import com.college.attendance.dto.FaceEnrollmentResponse;
import com.college.attendance.service.FaceDataService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/face")
public class FaceController {

    private final RestClient restClient;
    private final String baseUrl;
    private final FaceDataService faceDataService;

    public FaceController(@Value("${ai.service.base-url:http://localhost:8000}") String baseUrl,
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

    @PostMapping("/recognize")
    public ResponseEntity<Map<String, Object>> recognizeImage(@RequestBody Map<String, Object> payload) {
        try {
            payload.put("enrolled_faces", faceDataService.getRecognitionCandidates());
            Map<String, Object> aiResponse = restClient.post()
                .uri("/api/face/recognize")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(Map.class);

            if (aiResponse != null) {
                return ResponseEntity.ok(aiResponse);
            }
        } catch (ResourceAccessException ex) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "DeepFace + FaceNet512 service is not available because the Python AI service is not running at " + baseUrl + ": " + ex.getMessage());
            response.put("model_loaded", false);
            response.put("faces_detected", 0);
            response.put("matches", new ArrayList<>());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
        } catch (Exception ex) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Face recognition proxy error: " + ex.getMessage());
            response.put("model_loaded", false);
            response.put("faces_detected", 0);
            response.put("matches", new ArrayList<>());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("success", false);
        fallback.put("error", "Empty response from AI service");
        fallback.put("model_loaded", false);
        fallback.put("faces_detected", 0);
        fallback.put("matches", new ArrayList<>());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(fallback);
    }

    @PostMapping("/enroll")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<FaceEnrollmentResponse> enrollFace(
            @Valid @RequestBody FaceEnrollmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> poses = new LinkedHashMap<>();
        poses.put("front", request.poses().front());
        poses.put("left", request.poses().left() != null ? request.poses().left() : List.of());
        poses.put("right", request.poses().right() != null ? request.poses().right() : List.of());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("student_id", request.studentId());
        payload.put("name", request.name());
        payload.put("poses", poses);
        payload.put("min_usable_frames", 3);
        payload.put("persist_template", false);

        Map<?, ?> aiResult = restClient.post()
            .uri("/api/face/enroll")
            .contentType(MediaType.APPLICATION_JSON)
            .body(payload)
            .retrieve()
            .body(Map.class);

        if (aiResult == null || !Boolean.parseBoolean(String.valueOf(aiResult.get("success")))) {
            Object message = aiResult != null ? aiResult.get("message") : null;
            throw new IllegalStateException(message != null ? message.toString() : "AI enrollment returned no result.");
        }

        Object embeddingJson = aiResult.get("embedding_json");
        if (embeddingJson == null || embeddingJson.toString().isBlank()) {
            throw new IllegalStateException("AI enrollment did not return a biometric template.");
        }
        String adminUsername = userDetails != null ? userDetails.getUsername() : "admin";
        FaceDataResponse saved = faceDataService.registerFaceWithAdmin(
            request.studentId(), embeddingJson.toString(), "FaceNet512", List.of(), adminUsername);

        int usableFrames = aiResult.get("usable_frames") instanceof Number n ? n.intValue() : 0;
        int totalFrames = aiResult.get("total_frames") instanceof Number n ? n.intValue() : 0;
        @SuppressWarnings("unchecked")
        List<String> angles = aiResult.get("angles_covered") instanceof List<?> values
            ? values.stream().map(Object::toString).toList() : List.of();
        return ResponseEntity.ok(new FaceEnrollmentResponse(saved, usableFrames, totalFrames, angles,
            "Face template generated and stored successfully."));
    }

    @GetMapping("/busy")
    public ResponseEntity<Map<String, Object>> isBusy() {
        return ResponseEntity.ok(Map.of("busy", false));
    }

    @GetMapping("/status/{studentId}")
    public ResponseEntity<Map<String, Object>> getFaceStatus(@PathVariable String studentId) {
        return ResponseEntity.ok(faceDataService.getFaceStatus(studentId));
    }
}
