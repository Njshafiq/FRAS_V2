package com.college.attendance.service;

import com.college.attendance.dto.AdminContactOtpVerifyRequest;
import com.college.attendance.dto.AdminProfileResponse;
import com.college.attendance.dto.AdminProfileUpdateRequest;
import com.college.attendance.dto.AdminSecurityActionRequest;
import com.college.attendance.dto.OtpResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.User;
import com.college.attendance.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSecurityVerificationService {

    private static final Logger log = LoggerFactory.getLogger(AdminSecurityVerificationService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final AdminAuditLogService auditLogService;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public AdminSecurityVerificationService(UserRepository userRepository,
                                           PasswordEncoder passwordEncoder,
                                           OtpService otpService,
                                           AdminAuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.auditLogService = auditLogService;
    }

    public AdminProfileResponse getAdminProfile(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + username));
        return new AdminProfileResponse(
            user.getId(),
            user.getUsername(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            user.isEmailVerified(),
            user.isPhoneVerified()
        );
    }

    @Transactional
    public AdminProfileResponse updateAdminProfile(String username, AdminProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + username));

        boolean emailChanged = user.getEmail() == null || !user.getEmail().equalsIgnoreCase(request.email().trim());
        boolean phoneChanged = (user.getPhone() == null && request.phone() != null) ||
            (user.getPhone() != null && !user.getPhone().equals(request.phone()));

        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPhone(request.phone() != null ? request.phone().trim() : null);

        if (emailChanged) {
            user.setEmailVerified(false);
        }
        if (phoneChanged) {
            user.setPhoneVerified(false);
        }

        User updated = userRepository.save(user);

        auditLogService.logAction(
            username,
            "UPDATE_SECURITY_CONTACT",
            "ADMIN_SECURITY",
            username,
            "Updated contact details (email=" + user.getEmail() + ", phone=" + user.getPhone() + ")",
            null
        );

        return new AdminProfileResponse(
            updated.getId(),
            updated.getUsername(),
            updated.getName(),
            updated.getEmail(),
            updated.getPhone(),
            updated.getRole(),
            updated.isEmailVerified(),
            updated.isPhoneVerified()
        );
    }

    public OtpResponse requestActionOtp(String adminUsername, String actionPurpose, String targetId) {
        User user = userRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminUsername));

        String targetEmail = user.getEmail();
        if (targetEmail == null || targetEmail.isBlank()) {
            throw new IllegalStateException("Admin does not have a registered email security contact. Please configure your profile first.");
        }

        String purposeKey = "ADMIN_ACTION:" + actionPurpose.trim().toUpperCase();
        OtpResponse otp = otpService.generateOtp(purposeKey, adminUsername);

        log.info("[ADMIN_SECURITY_OTP] Generated OTP for admin '{}' for action '{}' target '{}'. Delivered to email: {}",
            adminUsername, actionPurpose, targetId, targetEmail);

        trySendEmail(targetEmail, "Security Authorization Code: " + otp.otpCode(),
            "Your FRAS Admin Security OTP is: " + otp.otpCode() + "\n" +
            "This OTP was requested for action: " + actionPurpose + (targetId != null ? " (Target: " + targetId + ")" : "") + "\n" +
            "It will expire in 5 minutes.\nIf you did not initiate this action, please contact system administration immediately.");

        return otp;
    }

    public void verifyAdminAction(String adminUsername, AdminSecurityActionRequest req, String actionPurpose, String targetId) {
        if (req == null) {
            throw new IllegalArgumentException("Security verification payload is required.");
        }

        User user = userRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminUsername));

        String mode = req.verificationType() != null ? req.verificationType().trim().toUpperCase() : "";
        if (mode.isBlank()) {
            if (req.password() != null && !req.password().isBlank()) {
                mode = "PASSWORD";
            } else if (req.otpCode() != null && !req.otpCode().isBlank()) {
                mode = "OTP";
            } else {
                throw new IllegalArgumentException("Please provide Admin Password or Admin OTP for verification.");
            }
        }

        if ("BOTH".equals(mode)) {
            verifyPassword(user, req.password());
            verifyOtp(adminUsername, actionPurpose, req.otpCode());
        } else if ("OTP".equals(mode)) {
            verifyOtp(adminUsername, actionPurpose, req.otpCode());
        } else {
            // Default: PASSWORD
            verifyPassword(user, req.password());
        }
    }

    private void verifyPassword(User user, String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Admin password is required.");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid admin password. Verification failed.");
        }
    }

    private void verifyOtp(String adminUsername, String actionPurpose, String otpCode) {
        if (otpCode == null || otpCode.isBlank()) {
            throw new IllegalArgumentException("Admin security OTP is required.");
        }
        String purposeKey = "ADMIN_ACTION:" + actionPurpose.trim().toUpperCase();
        boolean valid = otpService.verifyOtp(purposeKey, adminUsername, otpCode.trim());
        if (!valid) {
            throw new IllegalArgumentException("Invalid or expired Admin OTP. Verification failed.");
        }
        otpService.clearOtp(purposeKey, adminUsername);
    }

    public OtpResponse requestContactVerificationOtp(String adminUsername, String contactType) {
        User user = userRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminUsername));

        String type = contactType.trim().toUpperCase();
        String destination = "EMAIL".equals(type) ? user.getEmail() : user.getPhone();

        if (destination == null || destination.isBlank()) {
            throw new IllegalArgumentException("Admin " + contactType + " is not set in profile.");
        }

        String purposeKey = "VERIFY_CONTACT:" + type;
        OtpResponse otp = otpService.generateOtp(purposeKey, adminUsername);

        log.info("[ADMIN_CONTACT_VERIFY] Generated OTP for verifying {} for admin '{}': {}",
            type, adminUsername, otp.otpCode());

        if ("EMAIL".equals(type)) {
            trySendEmail(destination, "Verify Your Admin Security Email",
                "Your verification code is: " + otp.otpCode() + ". It will expire in 5 minutes.");
        }

        return otp;
    }

    @Transactional
    public AdminProfileResponse verifyContact(String adminUsername, AdminContactOtpVerifyRequest request) {
        User user = userRepository.findByUsername(adminUsername)
            .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminUsername));

        String type = request.contactType().trim().toUpperCase();
        String purposeKey = "VERIFY_CONTACT:" + type;

        boolean valid = otpService.verifyOtp(purposeKey, adminUsername, request.otpCode().trim());
        if (!valid) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }
        otpService.clearOtp(purposeKey, adminUsername);

        if ("EMAIL".equals(type)) {
            user.setEmailVerified(true);
        } else if ("PHONE".equals(type)) {
            user.setPhoneVerified(true);
        }

        User updated = userRepository.save(user);

        auditLogService.logAction(
            adminUsername,
            "VERIFY_SECURITY_CONTACT",
            "ADMIN_SECURITY",
            adminUsername,
            "Verified " + type + " successfully",
            null
        );

        return new AdminProfileResponse(
            updated.getId(),
            updated.getUsername(),
            updated.getName(),
            updated.getEmail(),
            updated.getPhone(),
            updated.getRole(),
            updated.isEmailVerified(),
            updated.isPhoneVerified()
        );
    }

    private void trySendEmail(String to, String subject, String text) {
        if (mailSender == null) {
            log.info("[MOCK_EMAIL] (JavaMailSender disabled) To: {} | Subject: {} | Content:\n{}", to, subject, text);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
            log.info("Successfully dispatched security email to {}", to);
        } catch (Exception ex) {
            log.warn("Could not dispatch SMTP email (host may not be reachable): {}. OTP was logged to console.", ex.getMessage());
        }
    }
}
