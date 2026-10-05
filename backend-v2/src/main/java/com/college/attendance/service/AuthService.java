package com.college.attendance.service;

import com.college.attendance.dto.AuthRequest;
import com.college.attendance.dto.AuthResponse;
import com.college.attendance.dto.ChangePasswordRequest;
import com.college.attendance.dto.ForgotPasswordRequest;
import com.college.attendance.dto.OtpResponse;
import com.college.attendance.dto.ResetPasswordRequest;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.User;
import com.college.attendance.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       UserService userService,
                       OtpService otpService,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userService = userService;
        this.otpService = otpService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(AuthRequest request) {
        // Resolve user by username or email
        User user = userService.findByIdentifier(request.username())
            .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password"));

        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.password())
            );

            String token = jwtTokenProvider.generateToken(user);
            return new AuthResponse(token, user.getUsername(), user.getName(), user.getRole().name());
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid username/email or password");
        }
    }

    public OtpResponse requestPasswordResetOtp(ForgotPasswordRequest request) {
        User user = userService.findByIdentifier(request.identifier())
            .orElseThrow(() -> new ResourceNotFoundException("No user found with identifier: " + request.identifier()));

        OtpResponse generated = otpService.generateOtp("PASSWORD_RESET", user.getUsername());
        // Never return the actual OTP code in password-reset API responses
        return new OtpResponse(user.getUsername(), null, generated.purpose(), generated.expiresAt());
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userService.findByIdentifier(request.identifier())
            .orElseThrow(() -> new ResourceNotFoundException("No user found with identifier: " + request.identifier()));

        boolean verified = otpService.verifyOtp("PASSWORD_RESET", user.getUsername(), request.otpCode());
        if (!verified) {
            throw new IllegalArgumentException("Invalid or expired OTP for password reset");
        }

        userService.updatePassword(user, request.newPassword());
        otpService.clearOtp("PASSWORD_RESET", user.getUsername());
    }

    public void changePassword(String currentUsername, ChangePasswordRequest request) {
        User user = userService.findByUsername(currentUsername)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password");
        }

        userService.updatePassword(user, request.newPassword());
    }
}
