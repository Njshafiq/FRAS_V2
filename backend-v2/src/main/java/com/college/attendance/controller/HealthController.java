package com.college.attendance.controller;

import com.college.attendance.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "FRAS Attendance V2 API is running",
            "swaggerUi", "/swagger-ui/index.html",
            "health", "/api/health"
        ));
    }

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(
            new HealthResponse(
                "OK",
                "Service running normally",
                "FRAS V2",
                "2.0.0-SNAPSHOT",
                "CONNECTED",
                "PostgreSQL",
                "18"
            )
        );
    }
}
