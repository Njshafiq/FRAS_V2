package com.college.attendance.service;

import com.college.attendance.dto.AttendanceRecordResponse;
import com.college.attendance.dto.AttendanceSessionResponse;
import com.college.attendance.dto.AuditLogResponse;
import com.college.attendance.dto.BulkAttendanceRequest;
import com.college.attendance.dto.CorrectionApprovalDto;
import com.college.attendance.dto.CorrectionRequestCreateDto;
import com.college.attendance.dto.CorrectionRequestResponse;
import com.college.attendance.dto.FaceRecognitionResult;
import com.college.attendance.dto.ImageRecognitionResult;
import com.college.attendance.dto.MultiFrameRecognitionRequest;
import com.college.attendance.dto.MultiFrameRecognitionResponse;
import com.college.attendance.dto.SessionAttendanceReviewResponse;
import com.college.attendance.dto.TeacherDashboardSummary;
import com.college.attendance.dto.TimetableSlotResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.*;
import com.college.attendance.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@Transactional
public class AttendanceService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final ClassEntityRepository classEntityRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherClassAssignmentRepository teacherClassAssignmentRepository;
    private final TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;
    private final AttendanceCorrectionRequestRepository correctionRequestRepository;
    private final AttendanceAuditLogRepository auditLogRepository;
    private final FaceRecognitionService faceRecognitionService;

    public AttendanceService(AttendanceSessionRepository attendanceSessionRepository,
                             AttendanceRecordRepository attendanceRecordRepository,
                             TimetableSlotRepository timetableSlotRepository,
                             ClassEntityRepository classEntityRepository,
                             SubjectRepository subjectRepository,
                             StudentRepository studentRepository,
                             TeacherRepository teacherRepository,
                             TeacherClassAssignmentRepository teacherClassAssignmentRepository,
                             TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository,
                             AttendanceCorrectionRequestRepository correctionRequestRepository,
                             AttendanceAuditLogRepository auditLogRepository,
                             FaceRecognitionService faceRecognitionService) {
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.timetableSlotRepository = timetableSlotRepository;
        this.classEntityRepository = classEntityRepository;
        this.subjectRepository = subjectRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.teacherClassAssignmentRepository = teacherClassAssignmentRepository;
        this.teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
        this.correctionRequestRepository = correctionRequestRepository;
        this.auditLogRepository = auditLogRepository;
        this.faceRecognitionService = faceRecognitionService;
    }

    // -------------------------------------------------------------
    // Teacher Authorization Checks
    // -------------------------------------------------------------
    public void verifyTeacherAssignedToClass(String teacherId, Long classId) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherId));
        ClassEntity classEntity = classEntityRepository.findById(classId)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));
        if (!teacherClassAssignmentRepository.existsByTeacherTeacherIdAndClassEntityId(teacherId, classId)) {
            String msg = String.format(
                "Teacher \"%s\" (ID: %s) is not assigned to class \"%s\" (ID: %d, Code: %s).",
                teacher.getName(), teacherId,
                classEntity.getClassName(), classId, classEntity.getClassCode()
            );
            throw new IllegalArgumentException(msg);
        }
    }

    public void verifyTeacherAssignedToSubject(String teacherId, Long subjectId, Long classId) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherId));
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));
        ClassEntity classEntity = classEntityRepository.findById(classId)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + classId));
        if (!teacherSubjectAssignmentRepository.existsByTeacherTeacherIdAndSubjectIdAndClassEntityId(teacherId, subjectId, classId)) {
            String msg = String.format(
                "Teacher \"%s\" (ID: %s) is not assigned to subject \"%s\" (ID: %d, Code: %s) in class \"%s\" (ID: %d, Code: %s).",
                teacher.getName(), teacherId,
                subject.getSubjectName(), subjectId, subject.getSubjectCode(),
                classEntity.getClassName(), classId, classEntity.getClassCode()
            );
            throw new IllegalArgumentException(msg);
        }
    }

    private void verifySessionNotLocked(AttendanceSession session) {
        if (session.getStatus() == AttendanceSessionStatus.LOCKED || session.getStatus() == AttendanceSessionStatus.COMPLETED) {
            throw new IllegalStateException("Attendance session " + session.getId() + " is LOCKED/COMPLETED. Direct modifications are disallowed.");
        }
    }

    // -------------------------------------------------------------
    // Dashboard & History
    // -------------------------------------------------------------
    public TeacherDashboardSummary getTeacherDashboard(String teacherId) {
        List<TeacherClassAssignment> classAssignments = teacherClassAssignmentRepository.findByTeacherTeacherId(teacherId);
        List<TeacherSubjectAssignment> subjectAssignments = teacherSubjectAssignmentRepository.findByTeacherTeacherId(teacherId);
        List<TimetableSlot> allSlots = timetableSlotRepository.findByTeacherTeacherId(teacherId);

        String currentDay = LocalDate.now().getDayOfWeek().name();
        List<TimetableSlot> todaysSlots = allSlots.stream()
            .filter(s -> s.getDayOfWeek() != null && s.getDayOfWeek().equalsIgnoreCase(currentDay))
            .toList();

        List<AttendanceSession> todaysSessions = attendanceSessionRepository.findByTeacherTeacherIdAndSessionDate(teacherId, LocalDate.now());
        long completedToday = todaysSessions.stream()
            .filter(s -> s.getStatus() == AttendanceSessionStatus.LOCKED || s.getStatus() == AttendanceSessionStatus.COMPLETED)
            .count();

        List<TimetableSlotResponse> schedule = todaysSlots.stream().map(this::toSlotResponse).toList();

        return new TeacherDashboardSummary(
            classAssignments.size(),
            subjectAssignments.size(),
            todaysSlots.size(),
            (int) completedToday,
            (int) Math.max(0, todaysSlots.size() - completedToday),
            schedule
        );
    }

    public List<AttendanceSessionResponse> getSessionsByTeacher(String teacherId) {
        return attendanceSessionRepository.findByTeacherTeacherId(teacherId).stream()
            .map(this::toSessionResponse)
            .toList();
    }

    public List<AttendanceSessionResponse> getSessionsFiltered(String teacherId, Long classId, Long subjectId, LocalDate date) {
        List<AttendanceSession> sessions;
        if (classId != null) {
            sessions = attendanceSessionRepository.findByTeacherTeacherIdAndClassEntityId(teacherId, classId);
        } else if (subjectId != null) {
            sessions = attendanceSessionRepository.findByTeacherTeacherIdAndSubjectId(teacherId, subjectId);
        } else if (date != null) {
            sessions = attendanceSessionRepository.findByTeacherTeacherIdAndSessionDate(teacherId, date);
        } else {
            sessions = attendanceSessionRepository.findByTeacherTeacherId(teacherId);
        }

        if (date != null) {
            sessions = sessions.stream().filter(s -> s.getSessionDate().equals(date)).toList();
        }
        return sessions.stream().map(this::toSessionResponse).toList();
    }

    public SessionAttendanceReviewResponse getSessionReview(Long sessionId, String teacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + sessionId));

        List<AttendanceRecord> records = attendanceRecordRepository.findByAttendanceSessionId(sessionId);
        List<AttendanceRecordResponse> recordResponses = records.stream().map(this::toRecordResponse).toList();

        return new SessionAttendanceReviewResponse(
            session.getId(),
            session.getStatus() != null ? session.getStatus().name() : null,
            session.getTotalStudents(),
            session.getPresentCount(),
            session.getAbsentCount(),
            session.getLateCount(),
            recordResponses
        );
    }

    // -------------------------------------------------------------
    // Session Creation & Workflows
    // -------------------------------------------------------------
    public AttendanceSessionResponse createSession(Long timetableSlotId, LocalDate sessionDate, LocalTime startTime, LocalTime endTime, String status) {
        TimetableSlot timetableSlot = timetableSlotRepository.findById(timetableSlotId)
            .orElseThrow(() -> new ResourceNotFoundException("Timetable slot not found with id: " + timetableSlotId));

        LocalDate date = sessionDate != null ? sessionDate : LocalDate.now();
        java.util.Optional<AttendanceSession> existingCreatedOpt = attendanceSessionRepository.findFirstByTimetableSlotIdAndSessionDate(timetableSlotId, date);
        if (existingCreatedOpt.isPresent()) {
            AttendanceSession existing = existingCreatedOpt.get();
            if (existing.getStatus() == AttendanceSessionStatus.IN_PROGRESS || existing.getStatus() == AttendanceSessionStatus.SCHEDULED) {
                return toSessionResponse(existing);
            }
            throw new IllegalArgumentException("Attendance session already exists and is " + existing.getStatus().name().toLowerCase() + " for timetable slot " + timetableSlotId + " on date " + date);
        }

        AttendanceSession session = new AttendanceSession();
        session.setTimetableSlot(timetableSlot);
        session.setClassEntity(timetableSlot.getClassEntity());
        session.setSubject(timetableSlot.getSubject());
        session.setTeacher(timetableSlot.getTeacher());
        session.setSessionDate(date);
        session.setStartTime(startTime);
        session.setEndTime(endTime);
        session.setStatus(parseSessionStatus(status));
        session.setTotalStudents((int) studentRepository.findActiveStudentsByClass(timetableSlot.getClassEntity().getId()).size());

        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    public AttendanceSessionResponse startQuickSession(String teacherId, Long classId, Long subjectId) {
        verifyTeacherAssignedToClass(teacherId, classId);
        verifyTeacherAssignedToSubject(teacherId, subjectId, classId);

        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherId));
        ClassEntity classEntity = timetableSlotRepository.findAll().stream()
            .map(TimetableSlot::getClassEntity)
            .filter(c -> c != null && c.getId().equals(classId))
            .findFirst()
            .orElse(null);

        // Find timetable slot or fallback
        String today = LocalDate.now().getDayOfWeek().name();
        TimetableSlot slot = timetableSlotRepository.findByTeacherTeacherId(teacherId).stream()
            .filter(s -> s.getClassEntity().getId().equals(classId) && s.getSubject().getId().equals(subjectId))
            .filter(s -> s.getDayOfWeek().equalsIgnoreCase(today))
            .findFirst()
            .orElseGet(() -> timetableSlotRepository.findByTeacherTeacherId(teacherId).stream()
                .filter(s -> s.getClassEntity().getId().equals(classId) && s.getSubject().getId().equals(subjectId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No timetable slot exists for teacher, class, and subject.")));

        LocalDate todayDate = LocalDate.now();
        java.util.Optional<AttendanceSession> existingQuickOpt = attendanceSessionRepository.findFirstByTimetableSlotIdAndSessionDate(slot.getId(), todayDate);
        if (existingQuickOpt.isPresent()) {
            AttendanceSession existing = existingQuickOpt.get();
            if (existing.getStatus() == AttendanceSessionStatus.IN_PROGRESS || existing.getStatus() == AttendanceSessionStatus.SCHEDULED) {
                return toSessionResponse(existing);
            }
            throw new IllegalArgumentException("An attendance session for today's slot has already been " + existing.getStatus().name().toLowerCase() + ".");
        }

        AttendanceSession session = new AttendanceSession();
        session.setTimetableSlot(slot);
        session.setClassEntity(slot.getClassEntity());
        session.setSubject(slot.getSubject());
        session.setTeacher(teacher);
        session.setSessionDate(todayDate);
        session.setStartTime(LocalTime.now());
        session.setEndTime(LocalTime.now().plusHours(1));
        session.setStatus(AttendanceSessionStatus.IN_PROGRESS);
        session.setTotalStudents(studentRepository.findActiveStudentsByClass(classId).size());

        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    // -------------------------------------------------------------
    // Single & Bulk Attendance Marking
    // -------------------------------------------------------------
    public AttendanceRecordResponse markAttendance(Long sessionId, String studentId, String status, Double confidenceScore, String markedByTeacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + sessionId));

        verifySessionNotLocked(session);

        if (markedByTeacherId != null && !session.getTeacher().getTeacherId().equalsIgnoreCase(markedByTeacherId)) {
            throw new IllegalArgumentException("Teacher is not authorized to mark attendance for this session");
        }

        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        Teacher markedBy = teacherRepository.findById(markedByTeacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + markedByTeacherId));

        AttendanceRecord record = attendanceRecordRepository.findByAttendanceSessionIdAndStudentStudentId(sessionId, studentId)
            .orElse(new AttendanceRecord(session, student, parseAttendanceStatus(status)));

        record.setStatus(parseAttendanceStatus(status));
        record.setConfidenceScore(confidenceScore);
        record.setMarkedBy(markedBy);
        record.setMarkedAt(LocalDateTime.now());

        AttendanceRecord saved = attendanceRecordRepository.save(record);
        refreshSessionCounts(session);
        return toRecordResponse(saved);
    }

    @Transactional
    public List<AttendanceRecordResponse> markBulkAttendance(Long sessionId, BulkAttendanceRequest request, String teacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + sessionId));

        if (teacherId == null || !session.getTeacher().getTeacherId().equalsIgnoreCase(teacherId)) {
            throw new IllegalArgumentException("Teacher is not authorized to mark attendance for this session");
        }

        verifySessionNotLocked(session);

        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        List<AttendanceRecordResponse> results = new ArrayList<>();
        for (BulkAttendanceRequest.StudentAttendanceItem item : request.attendanceList()) {
            Student student = studentRepository.findById(item.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + item.studentId()));

            AttendanceRecord record = attendanceRecordRepository.findByAttendanceSessionIdAndStudentStudentId(sessionId, item.studentId())
                .orElse(new AttendanceRecord(session, student, parseAttendanceStatus(item.status())));

            record.setStatus(parseAttendanceStatus(item.status()));
            record.setConfidenceScore(item.confidenceScore());
            record.setMarkedBy(teacher);
            record.setMarkedAt(LocalDateTime.now());
            results.add(toRecordResponse(attendanceRecordRepository.save(record)));
        }

        refreshSessionCounts(session);
        return results;
    }

    @Transactional
    public List<AttendanceRecordResponse> markAllPresent(Long sessionId, String teacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + sessionId));

        if (teacherId == null || !session.getTeacher().getTeacherId().equalsIgnoreCase(teacherId)) {
            throw new IllegalArgumentException("Teacher is not authorized to mark attendance for this session");
        }

        verifySessionNotLocked(session);

        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));

        List<Student> students = studentRepository.findActiveStudentsByClass(session.getClassEntity().getId());
        List<AttendanceRecordResponse> results = new ArrayList<>();

        for (Student student : students) {
            AttendanceRecord record = attendanceRecordRepository.findByAttendanceSessionIdAndStudentStudentId(sessionId, student.getStudentId())
                .orElse(new AttendanceRecord(session, student, AttendanceStatus.PRESENT));

            record.setStatus(AttendanceStatus.PRESENT);
            record.setConfidenceScore(1.0);
            record.setMarkedBy(teacher);
            record.setMarkedAt(LocalDateTime.now());
            results.add(toRecordResponse(attendanceRecordRepository.save(record)));
        }

        refreshSessionCounts(session);
        return results;
    }

    // -------------------------------------------------------------
    // Face Recognition (Single & Multi-frame)
    // -------------------------------------------------------------
    public AttendanceRecordResponse markAttendanceByRecognition(Long sessionId, String studentId, String embeddingData, String status, String markedByTeacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + sessionId));

        verifySessionNotLocked(session);

        FaceRecognitionResult recognitionResult = faceRecognitionService.recognizeFace(studentId, embeddingData);
        if (!recognitionResult.successful()) {
            throw new IllegalStateException(recognitionResult.message());
        }

        return markAttendance(
            sessionId,
            studentId,
            status == null || status.isBlank() ? "PRESENT" : status,
            recognitionResult.confidenceScore() != null ? recognitionResult.confidenceScore() : 0.0,
            markedByTeacherId
        );
    }

    @Transactional
    public AttendanceRecordResponse recognizeAndMarkAttendance(Long sessionId, List<String> frames, String teacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found: " + sessionId));
        if (teacherId == null || session.getTeacher() == null
                || !session.getTeacher().getTeacherId().equalsIgnoreCase(teacherId)) {
            throw new IllegalArgumentException("Teacher is not authorized to mark attendance for this session");
        }
        verifySessionNotLocked(session);

        ImageRecognitionResult result = faceRecognitionService.recognizeImages(frames);
        if (!result.successful() || result.studentId() == null) {
            throw new IllegalStateException(result.message());
        }
        Student student = studentRepository.findById(result.studentId())
            .orElseThrow(() -> new ResourceNotFoundException("Recognized student is not active in the system"));
        if (!student.isActive() || student.getClassEntity() == null
                || !student.getClassEntity().getId().equals(session.getClassEntity().getId())) {
            throw new IllegalArgumentException("Recognized student is not active in this attendance session's class");
        }
        return markAttendance(sessionId, student.getStudentId(), "PRESENT", result.confidenceScore(), teacherId);
    }

    @Transactional
    public MultiFrameRecognitionResponse processMultiFrameRecognition(MultiFrameRecognitionRequest request, String teacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(request.sessionId())
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found: " + request.sessionId()));

        verifySessionNotLocked(session);

        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherId));

        Map<String, Integer> frameVotes = new HashMap<>();
        Map<String, Double> confidences = new HashMap<>();
        List<String> unknownFrames = new ArrayList<>();

        int frameIndex = 0;
        for (MultiFrameRecognitionRequest.FrameItem frame : request.frames()) {
            frameIndex++;
            if (frame.studentId() == null || frame.studentId().isBlank() || "UNKNOWN".equalsIgnoreCase(frame.studentId())) {
                unknownFrames.add("Frame " + frameIndex + ": Unknown face detected");
                continue;
            }

            FaceRecognitionResult result = faceRecognitionService.recognizeFace(frame.studentId(), frame.embeddingData());
            if (result.successful()) {
                frameVotes.put(frame.studentId(), frameVotes.getOrDefault(frame.studentId(), 0) + 1);
                confidences.put(frame.studentId(), Math.max(confidences.getOrDefault(frame.studentId(), 0.0),
                    result.confidenceScore() != null ? result.confidenceScore() : 0.0));
            } else {
                unknownFrames.add("Frame " + frameIndex + " [Candidate " + frame.studentId() + "]: " + result.message());
            }
        }

        // Multi-frame confirmation: require at least 2 consistent recognitions (or single if only 1 sent)
        int minRequiredVotes = request.frames().size() >= 3 ? 2 : 1;
        List<String> recognizedStudents = new ArrayList<>();
        Long sessionClassId = session.getClassEntity().getId();

        for (Map.Entry<String, Integer> entry : frameVotes.entrySet()) {
            if (entry.getValue() >= minRequiredVotes) {
                String sid = entry.getKey();
                // Validate student belongs to session class
                Student student = studentRepository.findById(sid).orElse(null);
                if (student != null && student.getClassEntity() != null && student.getClassEntity().getId().equals(sessionClassId)) {
                    markAttendance(request.sessionId(), sid, "PRESENT", confidences.get(sid), teacherId);
                    recognizedStudents.add(sid);
                } else {
                    unknownFrames.add("Student " + sid + " does not belong to class " + sessionClassId);
                }
            }
        }

        return new MultiFrameRecognitionResponse(
            recognizedStudents.size(),
            unknownFrames.size(),
            recognizedStudents,
            unknownFrames,
            "Multi-frame recognition completed. " + recognizedStudents.size() + " students verified and marked."
        );
    }

    // -------------------------------------------------------------
    // Lock & Submit
    // -------------------------------------------------------------
    public AttendanceSessionResponse lockSession(Long sessionId, String teacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance session not found with id: " + sessionId));

        if (!session.getTeacher().getTeacherId().equalsIgnoreCase(teacherId)) {
            throw new IllegalArgumentException("Only the session owner can submit and lock this session.");
        }

        session.setStatus(AttendanceSessionStatus.LOCKED);
        refreshSessionCounts(session);
        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    // -------------------------------------------------------------
    // Correction Request & Audit Log Workflow
    // -------------------------------------------------------------
    public CorrectionRequestResponse submitCorrectionRequest(CorrectionRequestCreateDto dto, String teacherId) {
        AttendanceSession session = attendanceSessionRepository.findById(dto.sessionId())
            .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + dto.sessionId()));

        Student student = studentRepository.findById(dto.studentId())
            .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + dto.studentId()));

        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + teacherId));

        AttendanceRecord record = attendanceRecordRepository.findByAttendanceSessionIdAndStudentStudentId(dto.sessionId(), dto.studentId())
            .orElseThrow(() -> new ResourceNotFoundException("No attendance record found for student in this session"));

        AttendanceCorrectionRequest req = new AttendanceCorrectionRequest(
            session,
            student,
            teacher,
            record.getStatus(),
            parseAttendanceStatus(dto.requestedStatus()),
            dto.reason()
        );

        return toCorrectionResponse(correctionRequestRepository.save(req));
    }

    public List<CorrectionRequestResponse> getCorrectionRequestsByTeacher(String teacherId) {
        return correctionRequestRepository.findByTeacherTeacherId(teacherId).stream()
            .map(this::toCorrectionResponse)
            .toList();
    }

    public List<CorrectionRequestResponse> getAllCorrectionRequests() {
        return correctionRequestRepository.findAll().stream()
            .map(this::toCorrectionResponse)
            .toList();
    }

    @Transactional
    public CorrectionRequestResponse reviewCorrectionRequest(Long requestId, CorrectionApprovalDto dto, String adminUsername) {
        AttendanceCorrectionRequest request = correctionRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Correction request not found: " + requestId));

        if (request.getStatus() != CorrectionRequestStatus.PENDING) {
            throw new IllegalStateException("Correction request has already been processed.");
        }

        request.setAdminRemarks(dto.adminRemarks());
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(adminUsername);

        if (Boolean.TRUE.equals(dto.approve())) {
            request.setStatus(CorrectionRequestStatus.APPROVED);

            // Apply modification to record
            AttendanceRecord record = attendanceRecordRepository.findByAttendanceSessionIdAndStudentStudentId(
                request.getAttendanceSession().getId(), request.getStudent().getStudentId()
            ).orElseThrow(() -> new ResourceNotFoundException("Record not found for correction"));

            String oldStatus = record.getStatus().name();
            record.setStatus(request.getRequestedStatus());
            record.setMarkedAt(LocalDateTime.now());
            attendanceRecordRepository.save(record);

            refreshSessionCounts(request.getAttendanceSession());

            // Write immutable audit log
            AttendanceAuditLog log = new AttendanceAuditLog(
                request.getAttendanceSession().getId(),
                request.getStudent().getStudentId(),
                oldStatus,
                request.getRequestedStatus().name(),
                adminUsername,
                "CORRECTION_APPROVED",
                "Teacher reason: " + request.getReason() + " | Admin remarks: " + dto.adminRemarks()
            );
            auditLogRepository.save(log);
        } else {
            request.setStatus(CorrectionRequestStatus.REJECTED);
        }

        return toCorrectionResponse(correctionRequestRepository.save(request));
    }

    public List<AuditLogResponse> getAuditLogsForSession(Long sessionId) {
        return auditLogRepository.findBySessionId(sessionId).stream()
            .map(this::toAuditLogResponse)
            .toList();
    }

    public List<AuditLogResponse> getAllAuditLogs() {
        return auditLogRepository.findAll().stream()
            .map(this::toAuditLogResponse)
            .toList();
    }

    // -------------------------------------------------------------
    // Helper & Mapping Methods
    // -------------------------------------------------------------
    private void refreshSessionCounts(AttendanceSession session) {
        long present = attendanceRecordRepository.countBySessionIdAndStatus(session.getId(), AttendanceStatus.PRESENT);
        long late = attendanceRecordRepository.countBySessionIdAndStatus(session.getId(), AttendanceStatus.LATE);
        long absent = attendanceRecordRepository.countBySessionIdAndStatus(session.getId(), AttendanceStatus.ABSENT);

        session.setPresentCount((int) present);
        session.setLateCount((int) late);
        session.setAbsentCount((int) absent);
        if (session.getTotalStudents() == 0) {
            session.setTotalStudents((int) studentRepository.findByClassEntityId(session.getClassEntity().getId()).size());
        }
        attendanceSessionRepository.save(session);
    }

    private AttendanceSessionStatus parseSessionStatus(String status) {
        if (status == null || status.isBlank()) {
            return AttendanceSessionStatus.SCHEDULED;
        }
        return AttendanceSessionStatus.valueOf(status.trim().toUpperCase());
    }

    private AttendanceStatus parseAttendanceStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Attendance status is required");
        }
        return AttendanceStatus.valueOf(status.trim().toUpperCase());
    }

    private AttendanceSessionResponse toSessionResponse(AttendanceSession session) {
        return new AttendanceSessionResponse(
            session.getId(),
            session.getTimetableSlot() != null ? session.getTimetableSlot().getId() : null,
            session.getTeacher() != null ? session.getTeacher().getTeacherId() : null,
            session.getClassEntity() != null ? session.getClassEntity().getId() : null,
            session.getSubject() != null ? session.getSubject().getId() : null,
            session.getTimetableSlot() != null ? session.getTimetableSlot().getDayOfWeek() : null,
            session.getSessionDate(),
            session.getStartTime(),
            session.getEndTime(),
            session.getStatus() != null ? session.getStatus().name() : null,
            session.getPresentCount(),
            session.getAbsentCount(),
            session.getLateCount(),
            session.getTotalStudents(),
            session.getCreatedAt(),
            session.getUpdatedAt()
        );
    }

    private AttendanceRecordResponse toRecordResponse(AttendanceRecord record) {
        return new AttendanceRecordResponse(
            record.getId(),
            record.getAttendanceSession() != null ? record.getAttendanceSession().getId() : null,
            record.getStudent() != null ? record.getStudent().getStudentId() : null,
            record.getStatus() != null ? record.getStatus().name() : null,
            record.getConfidenceScore(),
            record.getMarkedBy() != null ? record.getMarkedBy().getTeacherId() : null,
            record.getMarkedAt()
        );
    }

    private TimetableSlotResponse toSlotResponse(TimetableSlot slot) {
        return new TimetableSlotResponse(
            slot.getId(),
            slot.getTeacher() != null ? slot.getTeacher().getTeacherId() : null,
            slot.getClassEntity() != null ? slot.getClassEntity().getId() : null,
            slot.getSubject() != null ? slot.getSubject().getId() : null,
            slot.getDayOfWeek(),
            slot.getStartTime(),
            slot.getEndTime(),
            slot.getRoomNumber(),
            slot.isActive(),
            slot.getCreatedAt(),
            slot.getUpdatedAt()
        );
    }

    private CorrectionRequestResponse toCorrectionResponse(AttendanceCorrectionRequest r) {
        return new CorrectionRequestResponse(
            r.getId(),
            r.getAttendanceSession() != null ? r.getAttendanceSession().getId() : null,
            r.getStudent() != null ? r.getStudent().getStudentId() : null,
            r.getStudent() != null ? r.getStudent().getName() : null,
            r.getTeacher() != null ? r.getTeacher().getTeacherId() : null,
            r.getCurrentStatus() != null ? r.getCurrentStatus().name() : null,
            r.getRequestedStatus() != null ? r.getRequestedStatus().name() : null,
            r.getReason(),
            r.getStatus() != null ? r.getStatus().name() : null,
            r.getAdminRemarks(),
            r.getReviewedAt(),
            r.getReviewedBy(),
            r.getCreatedAt()
        );
    }

    private AuditLogResponse toAuditLogResponse(AttendanceAuditLog a) {
        return new AuditLogResponse(
            a.getId(),
            a.getSessionId(),
            a.getStudentId(),
            a.getPreviousStatus(),
            a.getNewStatus(),
            a.getModifiedBy(),
            a.getModificationType(),
            a.getRemarks(),
            a.getLogTimestamp()
        );
    }
}
