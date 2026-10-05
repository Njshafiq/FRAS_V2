package com.college.attendance.service;

import com.college.attendance.dto.AttendanceReportItem;
import com.college.attendance.model.AttendanceRecord;
import com.college.attendance.model.AttendanceSession;
import com.college.attendance.repository.AttendanceRecordRepository;
import com.college.attendance.repository.AttendanceSessionRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AttendanceReportService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;

    public AttendanceReportService(AttendanceRecordRepository attendanceRecordRepository,
                                  AttendanceSessionRepository attendanceSessionRepository) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
    }

    public List<AttendanceReportItem> generateReport(String teacherId, Long classId, Long subjectId, String studentId, LocalDate startDate, LocalDate endDate) {
        List<AttendanceSession> sessions;
        if (teacherId != null && !teacherId.isBlank()) {
            sessions = attendanceSessionRepository.findByTeacherTeacherId(teacherId);
        } else {
            sessions = attendanceSessionRepository.findAll();
        }

        List<AttendanceReportItem> items = new ArrayList<>();

        for (AttendanceSession session : sessions) {
            if (classId != null && (session.getClassEntity() == null || !session.getClassEntity().getId().equals(classId))) {
                continue;
            }
            if (subjectId != null && (session.getSubject() == null || !session.getSubject().getId().equals(subjectId))) {
                continue;
            }
            if (startDate != null && session.getSessionDate().isBefore(startDate)) {
                continue;
            }
            if (endDate != null && session.getSessionDate().isAfter(endDate)) {
                continue;
            }

            List<AttendanceRecord> records = attendanceRecordRepository.findByAttendanceSessionId(session.getId());
            for (AttendanceRecord r : records) {
                if (studentId != null && !studentId.isBlank() && !r.getStudent().getStudentId().equalsIgnoreCase(studentId.trim())) {
                    continue;
                }

                items.add(new AttendanceReportItem(
                    r.getStudent().getStudentId(),
                    r.getStudent().getName(),
                    r.getStudent().getRegisterNumber(),
                    session.getClassEntity() != null ? session.getClassEntity().getClassName() : "",
                    session.getSubject() != null ? session.getSubject().getSubjectCode() : "",
                    session.getSubject() != null ? session.getSubject().getSubjectName() : "",
                    session.getSessionDate(),
                    r.getStatus() != null ? r.getStatus().name() : "",
                    r.getConfidenceScore(),
                    r.getMarkedBy() != null ? r.getMarkedBy().getName() : ""
                ));
            }
        }
        return items;
    }

    public byte[] exportReportToCsv(List<AttendanceReportItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Student ID,Student Name,Register Number,Class,Subject Code,Subject Name,Date,Status,Confidence Score,Marked By\n");

        for (AttendanceReportItem item : items) {
            sb.append(escapeCsv(item.studentId())).append(",")
              .append(escapeCsv(item.studentName())).append(",")
              .append(escapeCsv(item.registerNumber())).append(",")
              .append(escapeCsv(item.className())).append(",")
              .append(escapeCsv(item.subjectCode())).append(",")
              .append(escapeCsv(item.subjectName())).append(",")
              .append(item.sessionDate() != null ? item.sessionDate().toString() : "").append(",")
              .append(escapeCsv(item.status())).append(",")
              .append(item.confidenceScore() != null ? item.confidenceScore().toString() : "").append(",")
              .append(escapeCsv(item.markedBy())).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
