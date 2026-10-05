package com.college.attendance.service;

import com.college.attendance.dto.AdminDashboardStats;
import com.college.attendance.model.CorrectionRequestStatus;
import com.college.attendance.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AdminDashboardService {

    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassEntityRepository classEntityRepository;
    private final SubjectRepository subjectRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceCorrectionRequestRepository correctionRequestRepository;

    public AdminDashboardService(StudentRepository studentRepository,
                                 TeacherRepository teacherRepository,
                                 DepartmentRepository departmentRepository,
                                 ClassEntityRepository classEntityRepository,
                                 SubjectRepository subjectRepository,
                                 AttendanceSessionRepository attendanceSessionRepository,
                                 AttendanceCorrectionRequestRepository correctionRequestRepository) {
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.departmentRepository = departmentRepository;
        this.classEntityRepository = classEntityRepository;
        this.subjectRepository = subjectRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.correctionRequestRepository = correctionRequestRepository;
    }

    public AdminDashboardStats getDashboardStats() {
        long totalStudents = studentRepository.count();
        long activeStudents = studentRepository.findAll().stream().filter(s -> s.isActive()).count();

        long totalTeachers = teacherRepository.count();
        long activeTeachers = teacherRepository.findAll().stream().filter(t -> t.isActive()).count();

        long totalDepartments = departmentRepository.count();
        long totalClasses = classEntityRepository.count();
        long totalSubjects = subjectRepository.count();

        long sessionsToday = attendanceSessionRepository.findBySessionDate(LocalDate.now()).size();
        long pendingCorrections = correctionRequestRepository.findByStatus(CorrectionRequestStatus.PENDING).size();

        return new AdminDashboardStats(
            totalStudents,
            activeStudents,
            totalTeachers,
            activeTeachers,
            totalDepartments,
            totalClasses,
            totalSubjects,
            sessionsToday,
            pendingCorrections
        );
    }
}
