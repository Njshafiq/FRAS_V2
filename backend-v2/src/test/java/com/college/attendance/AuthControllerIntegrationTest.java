package com.college.attendance;

import com.college.attendance.dto.AuthRequest;
import com.college.attendance.model.Role;
import com.college.attendance.repository.UserRepository;
import com.college.attendance.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void seedUsers() {
        userRepository.deleteAll();
        userService.createUser("admin", "secret123", "System Admin", "admin@example.com", Role.ADMIN);
        userService.createUser("student1", "secret123", "Student One", "student@example.com", Role.STUDENT);
    }

    @Test
    void initializeDefaultUsersShouldSeedMissingAccounts() {
        userRepository.deleteAll();

        userService.initializeDefaultUsers();

        assert userRepository.findByUsername("admin").isPresent();
        assert userRepository.findByUsername("teacher1").isPresent();
        assert userRepository.findByUsername("student1").isPresent();
    }

    @Test
    void loginShouldReturnJwtForValidCredentials() throws Exception {
        AuthRequest request = new AuthRequest("admin", "secret123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("admin"))
            .andExpect(jsonPath("$.role").value("ADMIN"))
            .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @WithMockUser(username = "admin", authorities = {"ADMIN"})
    void adminEndpointShouldBeAccessibleForAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "student1", authorities = {"STUDENT"})
    void studentShouldNotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/health"))
            .andExpect(status().isForbidden());
    }

    @Autowired
    private com.college.attendance.service.OtpService otpService;

    @Test
    void shouldHandlePasswordResetWorkflowSecurely() throws Exception {
        com.college.attendance.dto.ForgotPasswordRequest forgotReq = new com.college.attendance.dto.ForgotPasswordRequest("student@example.com");
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(forgotReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.identifier").value("student1"))
            .andExpect(jsonPath("$.otpCode").value(org.hamcrest.Matchers.nullValue()));

        com.college.attendance.dto.ResetPasswordRequest invalidReset = new com.college.attendance.dto.ResetPasswordRequest("student1", "999999", "newSecret999");
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(invalidReset)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Bad Request"));

        var gen = otpService.generateOtp("PASSWORD_RESET", "student1");
        com.college.attendance.dto.ResetPasswordRequest validReset = new com.college.attendance.dto.ResetPasswordRequest("student1", gen.otpCode(), "newSecret999");
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(validReset)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        AuthRequest newLogin = new AuthRequest("student1", "newSecret999");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(newLogin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
