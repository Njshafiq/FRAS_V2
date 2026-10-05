package com.college.attendance.service;

import com.college.attendance.dto.FaceDeletionOtpResponse;
import com.college.attendance.dto.OtpResponse;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long OTP_TTL_MINUTES = 5;

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public FaceDeletionOtpResponse generateFaceDeletionOtp(String studentId) {
        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("Student id is required");
        }

        String key = "FACE_DELETE:" + studentId.trim();
        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        OtpEntry entry = new OtpEntry(otpCode, LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
        otpStore.put(key, entry);
        // keep legacy key as well for backward compatibility
        otpStore.put(studentId.trim(), entry);

        return new FaceDeletionOtpResponse(studentId.trim(), otpCode, entry.expiresAt());
    }

    public boolean verifyFaceDeletionOtp(String studentId, String otpCode) {
        if (studentId == null || studentId.isBlank() || otpCode == null || otpCode.isBlank()) {
            return false;
        }

        String key = "FACE_DELETE:" + studentId.trim();
        OtpEntry entry = otpStore.get(key);
        if (entry == null) {
            entry = otpStore.get(studentId.trim());
        }

        if (entry == null || entry.expiresAt().isBefore(LocalDateTime.now())) {
            otpStore.remove(key);
            otpStore.remove(studentId.trim());
            return false;
        }

        return entry.otpCode().equals(otpCode.trim());
    }

    public OtpResponse generateOtp(String purpose, String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Identifier is required");
        }
        String key = purpose + ":" + identifier.trim();
        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        OtpEntry entry = new OtpEntry(otpCode, LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
        otpStore.put(key, entry);

        return new OtpResponse(identifier.trim(), otpCode, purpose, entry.expiresAt());
    }

    public boolean verifyOtp(String purpose, String identifier, String otpCode) {
        if (identifier == null || identifier.isBlank() || otpCode == null || otpCode.isBlank()) {
            return false;
        }

        String key = purpose + ":" + identifier.trim();
        OtpEntry entry = otpStore.get(key);
        if (entry == null || entry.expiresAt().isBefore(LocalDateTime.now())) {
            otpStore.remove(key);
            return false;
        }

        return entry.otpCode().equals(otpCode.trim());
    }

    public void clearOtp(String purpose, String identifier) {
        if (identifier != null && !identifier.isBlank()) {
            otpStore.remove(purpose + ":" + identifier.trim());
        }
    }

    public void clearOtp(String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            otpStore.remove("FACE_DELETE:" + studentId.trim());
            otpStore.remove(studentId.trim());
        }
    }

    private record OtpEntry(String otpCode, LocalDateTime expiresAt) {
    }
}
