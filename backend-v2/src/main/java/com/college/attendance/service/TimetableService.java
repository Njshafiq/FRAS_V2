package com.college.attendance.service;

import com.college.attendance.dto.TimetableSlotRequest;
import com.college.attendance.dto.TimetableSlotResponse;
import com.college.attendance.exception.ResourceNotFoundException;
import com.college.attendance.model.ClassEntity;
import com.college.attendance.model.Subject;
import com.college.attendance.model.Teacher;
import com.college.attendance.model.TimetableSlot;
import com.college.attendance.repository.ClassEntityRepository;
import com.college.attendance.repository.SubjectRepository;
import com.college.attendance.repository.TeacherClassAssignmentRepository;
import com.college.attendance.repository.TeacherRepository;
import com.college.attendance.repository.TeacherSubjectAssignmentRepository;
import com.college.attendance.repository.TimetableSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class TimetableService {

    private final TimetableSlotRepository timetableSlotRepository;
    private final TeacherRepository teacherRepository;
    private final ClassEntityRepository classEntityRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherClassAssignmentRepository teacherClassAssignmentRepository;
    private final TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository;

    public TimetableService(TimetableSlotRepository timetableSlotRepository,
                            TeacherRepository teacherRepository,
                            ClassEntityRepository classEntityRepository,
                            SubjectRepository subjectRepository,
                            TeacherClassAssignmentRepository teacherClassAssignmentRepository,
                            TeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository) {
        this.timetableSlotRepository = timetableSlotRepository;
        this.teacherRepository = teacherRepository;
        this.classEntityRepository = classEntityRepository;
        this.subjectRepository = subjectRepository;
        this.teacherClassAssignmentRepository = teacherClassAssignmentRepository;
        this.teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
    }

    public List<TimetableSlotResponse> getAll() {
        return timetableSlotRepository.findAll().stream().map(this::toResponse).toList();
    }

    public TimetableSlotResponse getById(Long id) {
        TimetableSlot slot = timetableSlotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Timetable slot not found with id: " + id));
        return toResponse(slot);
    }

    public List<TimetableSlotResponse> getByTeacher(String teacherId) {
        return timetableSlotRepository.findByTeacherTeacherId(teacherId).stream().map(this::toResponse).toList();
    }

    public List<TimetableSlotResponse> getByClass(Long classId) {
        return timetableSlotRepository.findByClassEntityId(classId).stream().map(this::toResponse).toList();
    }

    public TimetableSlotResponse create(TimetableSlotRequest request) {
        return create(
            request.teacherId(),
            request.classId(),
            request.subjectId(),
            request.dayOfWeek(),
            request.startTime(),
            request.endTime(),
            request.roomNumber(),
            request.active()
        );
    }

    public TimetableSlotResponse create(String teacherId, Long classId, Long subjectId,
                                        String dayOfWeek, LocalTime startTime, LocalTime endTime,
                                        String roomNumber, boolean active) {
        Teacher teacher = teacherRepository.findById(teacherId)
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + teacherId));
        ClassEntity classEntity = classEntityRepository.findById(classId)
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        boolean classAssignmentExists = teacherClassAssignmentRepository.existsByTeacherTeacherIdAndClassEntityId(teacherId, classId);
        boolean subjectAssignmentExists = teacherSubjectAssignmentRepository.existsByTeacherTeacherIdAndSubjectIdAndClassEntityId(teacherId, subjectId, classId);

        // Verify teacher assignment to class with detailed error
        if (!classAssignmentExists) {
            String msg = String.format(
                "Teacher \"%s\" (ID: %s) is not assigned to class \"%s\" (ID: %d, Code: %s).",
                teacher.getName(), teacherId,
                classEntity.getClassName(), classId, classEntity.getClassCode()
            );
            throw new IllegalArgumentException(msg);
        }
        // Verify teacher assignment to subject within class with detailed error
        if (!subjectAssignmentExists) {
            String msg = String.format(
                "Teacher \"%s\" (ID: %s) is not assigned to subject \"%s\" (ID: %d, Code: %s) in class \"%s\" (ID: %d, Code: %s).",
                teacher.getName(), teacherId,
                subject.getSubjectName(), subjectId, subject.getSubjectCode(),
                classEntity.getClassName(), classId, classEntity.getClassCode()
            );
            throw new IllegalArgumentException(msg);
        }

        TimetableSlot slot = new TimetableSlot(classEntity, subject, teacher, dayOfWeek, startTime, endTime);
        slot.setRoomNumber(roomNumber);
        slot.setActive(active);
        return toResponse(timetableSlotRepository.save(slot));
    }

    public TimetableSlotResponse update(Long id, TimetableSlotRequest request) {
        TimetableSlot slot = timetableSlotRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Timetable slot not found with id: " + id));

        Teacher teacher = teacherRepository.findById(request.teacherId())
            .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + request.teacherId()));
        ClassEntity classEntity = classEntityRepository.findById(request.classId())
            .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + request.classId()));
        Subject subject = subjectRepository.findById(request.subjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.subjectId()));

        boolean classAssignmentExists = teacherClassAssignmentRepository.existsByTeacherTeacherIdAndClassEntityId(request.teacherId(), request.classId());
        boolean subjectAssignmentExists = teacherSubjectAssignmentRepository.existsByTeacherTeacherIdAndSubjectIdAndClassEntityId(request.teacherId(), request.subjectId(), request.classId());

        if (!classAssignmentExists) {
            String msg = String.format(
                "Teacher \"%s\" (ID: %s) is not assigned to class \"%s\" (ID: %d, Code: %s).",
                teacher.getName(), request.teacherId(),
                classEntity.getClassName(), request.classId(), classEntity.getClassCode()
            );
            throw new IllegalArgumentException(msg);
        }
        if (!subjectAssignmentExists) {
            String msg = String.format(
                "Teacher \"%s\" (ID: %s) is not assigned to subject \"%s\" (ID: %d, Code: %s) in class \"%s\" (ID: %d, Code: %s).",
                teacher.getName(), request.teacherId(),
                subject.getSubjectName(), request.subjectId(), subject.getSubjectCode(),
                classEntity.getClassName(), request.classId(), classEntity.getClassCode()
            );
            throw new IllegalArgumentException(msg);
        }

        slot.setTeacher(teacher);
        slot.setClassEntity(classEntity);
        slot.setSubject(subject);
        slot.setDayOfWeek(request.dayOfWeek());
        slot.setStartTime(request.startTime());
        slot.setEndTime(request.endTime());
        slot.setRoomNumber(request.roomNumber());
        slot.setActive(request.active());

        return toResponse(timetableSlotRepository.save(slot));
    }

    public void delete(Long id) {
        if (!timetableSlotRepository.existsById(id)) {
            throw new ResourceNotFoundException("Timetable slot not found with id: " + id);
        }
        timetableSlotRepository.deleteById(id);
    }

    public void deleteAll() {
        timetableSlotRepository.deleteAll();
    }

    private TimetableSlotResponse toResponse(TimetableSlot slot) {
        ClassEntity c = slot.getClassEntity();
        Subject s = slot.getSubject();
        Teacher t = slot.getTeacher();
        return new TimetableSlotResponse(
            slot.getId(),
            t != null ? t.getTeacherId() : null,
            t != null ? t.getName() : null,
            c != null ? c.getId() : null,
            c != null ? c.getClassName() : null,
            c != null ? c.getClassCode() : null,
            s != null ? s.getId() : null,
            s != null ? s.getSubjectName() : null,
            s != null ? s.getSubjectCode() : null,
            slot.getDayOfWeek(),
            slot.getStartTime(),
            slot.getEndTime(),
            slot.getRoomNumber(),
            slot.isActive(),
            slot.getCreatedAt(),
            slot.getUpdatedAt()
        );
    }
}
