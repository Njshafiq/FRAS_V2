package com.college.attendance.controller;

import com.college.attendance.dto.ApiResponse;
import com.college.attendance.dto.AuthRequest;
import com.college.attendance.dto.AuthResponse;
import com.college.attendance.dto.ChangePasswordRequest;
import com.college.attendance.dto.ForgotPasswordRequest;
import com.college.attendance.dto.OtpResponse;
import com.college.attendance.dto.ResetPasswordRequest;
import com.college.attendance.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<OtpResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.requestPasswordResetOtp(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new ApiResponse("Password reset successfully. You can now log in with your new password.", true));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                      @Valid @RequestBody ChangePasswordRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new ApiResponse("Unauthorized", false));
        }
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(new ApiResponse("Password changed successfully", true));
    }
}
