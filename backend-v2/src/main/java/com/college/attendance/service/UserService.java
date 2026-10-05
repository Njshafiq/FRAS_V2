package com.college.attendance.service;

import com.college.attendance.model.Role;
import com.college.attendance.model.User;
import com.college.attendance.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initializeDefaultUsers() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("UPDATE users SET email_verified = false WHERE email_verified IS NULL");
            jdbcTemplate.execute("UPDATE users SET phone_verified = false WHERE phone_verified IS NULL");
            jdbcTemplate.execute("UPDATE users SET email_verified = true, phone_verified = true WHERE username = 'admin'");
            jdbcTemplate.execute("ALTER TABLE face_samples ALTER COLUMN image_path TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_status_check");
            jdbcTemplate.execute("ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_status_check CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED'))");
        } catch (Exception ex) {
            // ignore if not supported or already altered
        }

        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = createUser("admin", "secret123", "System Admin", "admin@example.com", Role.ADMIN);
            admin.setPhone("+15551234567");
            admin.setEmailVerified(true);
            admin.setPhoneVerified(true);
            userRepository.save(admin);
        } else {
            userRepository.findByUsername("admin").ifPresent(admin -> {
                if (!admin.isEmailVerified()) {
                    admin.setEmailVerified(true);
                    if (admin.getPhone() == null) {
                        admin.setPhone("+15551234567");
                        admin.setPhoneVerified(true);
                    }
                    userRepository.save(admin);
                }
            });
        }
        if (userRepository.findByUsername("teacher1").isEmpty()) {
            createUser("teacher1", "secret123", "Teacher One", "teacher1@example.com", Role.TEACHER);
        }
        if (userRepository.findByUsername("student1").isEmpty()) {
            createUser("student1", "secret123", "Student One", "student1@example.com", Role.STUDENT);
        }
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String trimmed = identifier.trim();
        Optional<User> byUser = userRepository.findByUsername(trimmed);
        if (byUser.isPresent()) {
            return byUser;
        }
        return userRepository.findByEmail(trimmed);
    }

    public User createUser(String username, String rawPassword, String name, String email, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setActive(true);
        return userRepository.save(user);
    }

    public void updatePassword(User user, String newRawPassword) {
        user.setPassword(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
    }

    public User save(User user) {
        return userRepository.save(user);
    }
}
