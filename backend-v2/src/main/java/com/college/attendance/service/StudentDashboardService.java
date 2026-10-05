package com.college.attendance.service;

import com.college.attendance.dto.MonthlyAttendanceSummary;
import com.college.attendance.dto.OverallAttendanceSummary;
import com.college.attendance.dto.SemesterAttendanceSummary;
import com.college.attendance.dto.StudentAttendanceHistoryItem;
import com.college.attendance.dto.SubjectAttendanceSummary;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.AttendanceRecord;
import com.college.attendance.model.AttendanceStatus;
import com.college.attendance.model.Student;
import com.college.attendance.model.Subject;
import com.college.attendance.repository.AttendanceRecordRepository;
import com.college.attendance.repository.StudentRepository;
import com.college.attendance.dto.StudentProfileResponse;
import com.college.attendance.dto.TimetableSlotResponse;
import com.college.attendance.model.TimetableSlot;
import com.college.attendance.repository.FaceDataRepository;
import com.college.attendance.repository.TimetableSlotRepository;
import org.springframework.stereotype.Service;

import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StudentDashboardService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final StudentRepository studentRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final FaceDataRepository faceDataRepository;

    public StudentDashboardService(AttendanceRecordRepository attendanceRecordRepository,
                                  StudentRepository studentRepository,
                                  TimetableSlotRepository timetableSlotRepository,
                                  FaceDataRepository faceDataRepository) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.studentRepository = studentRepository;
        this.timetableSlotRepository = timetableSlotRepository;
        this.faceDataRepository = faceDataRepository;
    }

    public OverallAttendanceSummary getOverallAttendance(String studentId) {
        verifyStudent(studentId);
        List<AttendanceRecord> records = attendanceRecordRepository.findByStudentStudentId(studentId);

        int total = records.size();
        int present = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        int late = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
        int absent = (int) records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();

        double percentage = total == 0 ? 0.0 : Math.round((present * 100.0 / total) * 10.0) / 10.0;
        return new OverallAttendanceSummary(total, present, absent, late, percentage);
    }

    public List<SubjectAttendanceSummary> getSubjectWiseAttendance(String studentId) {
        verifyStudent(studentId);
        List<AttendanceRecord> records = attendanceRecordRepository.findByStudentStudentId(studentId);

        Map<Subject, List<AttendanceRecord>> grouped = records.stream()
            .filter(r -> r.getAttendanceSession() != null && r.getAttendanceSession().getSubject() != null)
            .collect(Collectors.groupingBy(r -> r.getAttendanceSession().getSubject()));

        List<SubjectAttendanceSummary> result = new ArrayList<>();
        for (Map.Entry<Subject, List<AttendanceRecord>> entry : grouped.entrySet()) {
            Subject subj = entry.getKey();
            List<AttendanceRecord> subRecords = entry.getValue();
            int total = subRecords.size();
            int present = (int) subRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
            int late = (int) subRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
            int absent = (int) subRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
            double pct = total == 0 ? 0.0 : Math.round((present * 100.0 / total) * 10.0) / 10.0;

            result.add(new SubjectAttendanceSummary(
                subj.getId(),
                subj.getSubjectCode(),
                subj.getSubjectName(),
                subj.getSemester(),
                total,
                present,
                absent,
                late,
                pct
            ));
        }

        result.sort(Comparator.comparing(SubjectAttendanceSummary::subjectName));
        return result;
    }

    public List<MonthlyAttendanceSummary> getMonthlyAttendance(String studentId) {
        verifyStudent(studentId);
        List<AttendanceRecord> records = attendanceRecordRepository.findByStudentStudentId(studentId);

        Map<String, List<AttendanceRecord>> byMonth = new LinkedHashMap<>();
        for (AttendanceRecord r : records) {
            if (r.getAttendanceSession() != null && r.getAttendanceSession().getSessionDate() != null) {
                int y = r.getAttendanceSession().getSessionDate().getYear();
                int m = r.getAttendanceSession().getSessionDate().getMonthValue();
                String key = y + "-" + (m < 10 ? "0" + m : String.valueOf(m));
                byMonth.computeIfAbsent(key, k -> new ArrayList<>()).add(r);
            }
        }

        List<MonthlyAttendanceSummary> summaries = new ArrayList<>();
        for (Map.Entry<String, List<AttendanceRecord>> entry : byMonth.entrySet()) {
            String[] parts = entry.getKey().split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            List<AttendanceRecord> mRecords = entry.getValue();

            int total = mRecords.size();
            int present = (int) mRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
            int late = (int) mRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
            int absent = (int) mRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
            double pct = total == 0 ? 0.0 : Math.round((present * 100.0 / total) * 10.0) / 10.0;
            String monthName = Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            summaries.add(new MonthlyAttendanceSummary(year, month, monthName, total, present, absent, late, pct));
        }

        summaries.sort(Comparator.comparing(MonthlyAttendanceSummary::year).reversed()
            .thenComparing(MonthlyAttendanceSummary::month, Comparator.reverseOrder()));
        return summaries;
    }

    public SemesterAttendanceSummary getSemesterAttendance(String studentId, Integer semester) {
        verifyStudent(studentId);
        List<AttendanceRecord> records = attendanceRecordRepository.findByStudentStudentId(studentId);

        List<AttendanceRecord> filtered = records.stream()
            .filter(r -> r.getAttendanceSession() != null && r.getAttendanceSession().getSubject() != null)
            .filter(r -> semester == null || semester.equals(r.getAttendanceSession().getSubject().getSemester()))
            .toList();

        int total = filtered.size();
        int present = (int) filtered.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        int late = (int) filtered.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
        int absent = (int) filtered.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
        double pct = total == 0 ? 0.0 : Math.round((present * 100.0 / total) * 10.0) / 10.0;

        Map<Subject, List<AttendanceRecord>> grouped = filtered.stream()
            .collect(Collectors.groupingBy(r -> r.getAttendanceSession().getSubject()));

        List<SubjectAttendanceSummary> subjectSummaries = new ArrayList<>();
        for (Map.Entry<Subject, List<AttendanceRecord>> entry : grouped.entrySet()) {
            Subject s = entry.getKey();
            List<AttendanceRecord> subRecs = entry.getValue();
            int subTotal = subRecs.size();
            int subPresent = (int) subRecs.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
            int subLate = (int) subRecs.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
            int subAbsent = (int) subRecs.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
            double subPct = subTotal == 0 ? 0.0 : Math.round((subPresent * 100.0 / subTotal) * 10.0) / 10.0;

            subjectSummaries.add(new SubjectAttendanceSummary(
                s.getId(),
                s.getSubjectCode(),
                s.getSubjectName(),
                s.getSemester(),
                subTotal,
                subPresent,
                subAbsent,
                subLate,
                subPct
            ));
        }

        subjectSummaries.sort(Comparator.comparing(SubjectAttendanceSummary::subjectName));
        return new SemesterAttendanceSummary(semester, total, present, absent, late, pct, subjectSummaries);
    }

    public List<StudentAttendanceHistoryItem> getAttendanceHistory(String studentId) {
        verifyStudent(studentId);
        List<AttendanceRecord> history = attendanceRecordRepository.findHistoryByStudentId(studentId);

        return history.stream().map(r -> new StudentAttendanceHistoryItem(
            r.getId(),
            r.getAttendanceSession() != null ? r.getAttendanceSession().getId() : null,
            r.getAttendanceSession() != null ? r.getAttendanceSession().getSessionDate() : null,
            r.getAttendanceSession() != null && r.getAttendanceSession().getSubject() != null ? r.getAttendanceSession().getSubject().getSubjectCode() : null,
            r.getAttendanceSession() != null && r.getAttendanceSession().getSubject() != null ? r.getAttendanceSession().getSubject().getSubjectName() : null,
            r.getAttendanceSession() != null && r.getAttendanceSession().getClassEntity() != null ? r.getAttendanceSession().getClassEntity().getClassName() : null,
            r.getAttendanceSession() != null && r.getAttendanceSession().getTeacher() != null ? r.getAttendanceSession().getTeacher().getName() : null,
            r.getStatus() != null ? r.getStatus().name() : null,
            r.getConfidenceScore(),
            r.getMarkedAt()
        )).toList();
    }

    public StudentProfileResponse getStudentProfile(String studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        Long classId = s.getClassEntity() != null ? s.getClassEntity().getId() : null;
        String className = s.getClassEntity() != null ? s.getClassEntity().getClassName() : null;
        String classCode = s.getClassEntity() != null ? s.getClassEntity().getClassCode() : null;
        String section = s.getClassEntity() != null ? s.getClassEntity().getSection() : null;
        Integer yearLevel = s.getClassEntity() != null ? s.getClassEntity().getYearLevel() : null;

        Long departmentId = null;
        String departmentName = null;
        String departmentCode = null;
        if (s.getClassEntity() != null && s.getClassEntity().getDepartment() != null) {
            departmentId = s.getClassEntity().getDepartment().getId();
            departmentName = s.getClassEntity().getDepartment().getName();
            departmentCode = s.getClassEntity().getDepartment().getDepartmentCode();
        }

        Long academicYearId = s.getAcademicYear() != null ? s.getAcademicYear().getId() : null;
        String academicYearName = s.getAcademicYear() != null ? s.getAcademicYear().getYearName() : null;

        boolean faceEnrolled = faceDataRepository.findByStudentStudentId(studentId)
            .map(fd -> fd.isActive()
                && fd.getRegistrationStatus() == com.college.attendance.model.FaceRegistrationStatus.COMPLETED
                && fd.getFaceStatus() == com.college.attendance.model.FaceStatus.REGISTERED)
            .orElse(false);

        return new StudentProfileResponse(
            s.getStudentId(),
            s.getName(),
            s.getRegisterNumber(),
            classId,
            className,
            classCode,
            section,
            yearLevel,
            departmentId,
            departmentName,
            departmentCode,
            academicYearId,
            academicYearName,
            s.getEmail(),
            s.getPhone(),
            s.getGender(),
            s.getDateOfBirth(),
            s.getEnrollmentDate(),
            s.isActive(),
            faceEnrolled
        );
    }

    public List<TimetableSlotResponse> getStudentTimetable(String studentId) {
        Student s = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (s.getClassEntity() == null) {
            return List.of();
        }

        List<TimetableSlot> slots = timetableSlotRepository.findByClassEntityId(s.getClassEntity().getId());

        return slots.stream()
            .filter(TimetableSlot::isActive)
            .map(slot -> new TimetableSlotResponse(
                slot.getId(),
                slot.getTeacher() != null ? slot.getTeacher().getTeacherId() : null,
                slot.getTeacher() != null ? slot.getTeacher().getName() : null,
                slot.getClassEntity() != null ? slot.getClassEntity().getId() : null,
                slot.getClassEntity() != null ? slot.getClassEntity().getClassName() : null,
                slot.getClassEntity() != null ? slot.getClassEntity().getClassCode() : null,
                slot.getSubject() != null ? slot.getSubject().getId() : null,
                slot.getSubject() != null ? slot.getSubject().getSubjectName() : null,
                slot.getSubject() != null ? slot.getSubject().getSubjectCode() : null,
                slot.getDayOfWeek(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getRoomNumber(),
                slot.isActive(),
                slot.getCreatedAt(),
                slot.getUpdatedAt()
            ))
            .toList();
    }

    private void verifyStudent(String studentId) {
        if (!studentRepository.existsByStudentId(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
    }
}
