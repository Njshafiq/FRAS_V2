-- ============================================================
-- FRAS V2 - Database Schema
-- College Face Recognition Attendance System - V2 Backend
-- PostgreSQL DDL for database: attendance_db
-- ============================================================

-- Drop all tables if they exist (for clean rebuilds during development)
-- Tables must be dropped in reverse dependency order
DROP TABLE IF EXISTS attendance_audit_logs CASCADE;
DROP TABLE IF EXISTS attendance_correction_requests CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS face_samples CASCADE;
DROP TABLE IF EXISTS face_data CASCADE;
DROP TABLE IF EXISTS timetable_slots CASCADE;
DROP TABLE IF EXISTS teacher_subject_assignments CASCADE;
DROP TABLE IF EXISTS teacher_class_assignments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. academic_years
-- ============================================================
CREATE TABLE academic_years (
    id              BIGSERIAL PRIMARY KEY,
    year_name       VARCHAR(50)  NOT NULL UNIQUE,
    start_date      DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. departments
-- ============================================================
CREATE TABLE departments (
    id              BIGSERIAL PRIMARY KEY,
    department_code VARCHAR(50)  NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. classes (Class / Section)
--    e.g., "CSE-A" under "CSE" department in "2024-2025" academic year
-- ============================================================
CREATE TABLE classes (
    id              BIGSERIAL PRIMARY KEY,
    class_name      VARCHAR(100) NOT NULL,
    class_code      VARCHAR(50)  NOT NULL UNIQUE,
    academic_year_id BIGINT      NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    department_id   BIGINT       NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    year_level      INTEGER      NOT NULL CHECK (year_level BETWEEN 1 AND 4),
    section         VARCHAR(20),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_classes_academic_department_name UNIQUE (academic_year_id, department_id, class_name)
);

-- ============================================================
-- 4. subjects
-- ============================================================
CREATE TABLE subjects (
    id              BIGSERIAL PRIMARY KEY,
    subject_code    VARCHAR(50)  NOT NULL UNIQUE,
    subject_name    VARCHAR(100) NOT NULL,
    department_id   BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    year_level      INTEGER CHECK (year_level BETWEEN 1 AND 4),
    semester        INTEGER,
    credits         INTEGER,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. users (authentication-related profile)
--    Separate from teacher/student records for role flexibility
-- ============================================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. teachers
--    teacher_id is VARCHAR to support alphanumeric values (e.g., T101)
-- ============================================================
CREATE TABLE teachers (
    teacher_id      VARCHAR(50)  PRIMARY KEY,
    user_id         BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(100),
    department_id   BIGINT       NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    hire_date       DATE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. students
--    student_id is VARCHAR to support alphanumeric values (e.g., S9344, 12356)
--    register_number is separate and also VARCHAR
-- ============================================================
CREATE TABLE students (
    student_id       VARCHAR(50)  PRIMARY KEY,
    user_id          BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    name             VARCHAR(100) NOT NULL,
    register_number   VARCHAR(50)  NOT NULL UNIQUE,
    class_id          BIGINT       NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    academic_year_id  BIGINT       NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    date_of_birth     DATE,
    gender            VARCHAR(20),
    phone             VARCHAR(20),
    email             VARCHAR(100),
    enrollment_date   DATE,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. teacher_class_assignments
--    Links teachers to classes they are assigned to
-- ============================================================
CREATE TABLE teacher_class_assignments (
    id              BIGSERIAL PRIMARY KEY,
    teacher_id      VARCHAR(50)  NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    class_id        BIGINT       NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_teacher_class UNIQUE (teacher_id, class_id)
);

-- ============================================================
-- 9. teacher_subject_assignments
--    Links teachers to subjects they teach in specific classes
-- ============================================================
CREATE TABLE teacher_subject_assignments (
    id              BIGSERIAL PRIMARY KEY,
    teacher_id      VARCHAR(50)  NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    subject_id      BIGINT       NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id        BIGINT       NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_teacher_subject_class UNIQUE (teacher_id, subject_id, class_id)
);

-- ============================================================
-- 10. timetable_slots
--     Connects: Class, Subject, Teacher, Day, Start/End time
-- ============================================================
CREATE TABLE timetable_slots (
    id              BIGSERIAL PRIMARY KEY,
    class_id        BIGINT       NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    subject_id      BIGINT       NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    teacher_id      VARCHAR(50)  NOT NULL REFERENCES teachers(teacher_id) ON DELETE RESTRICT,
    day_of_week     VARCHAR(20)  NOT NULL CHECK (
        day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')
    ),
    start_time      TIME         NOT NULL,
    end_time         TIME         NOT NULL,
    room_number      VARCHAR(50),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_timetable_slot UNIQUE (class_id, subject_id, teacher_id, day_of_week, start_time)
);

-- ============================================================
-- 11. face_data (separate from students)
--     Stores face embeddings and registration status
--     Deleting face_data MUST NOT delete the student
-- ============================================================
CREATE TABLE face_data (
    id                       BIGSERIAL PRIMARY KEY,
    student_id               VARCHAR(50)  NOT NULL UNIQUE REFERENCES students(student_id) ON DELETE CASCADE,
    model_version            VARCHAR(50),
    embedding_data           TEXT,
    registration_status      VARCHAR(20)  NOT NULL DEFAULT 'NOT_REGISTERED' CHECK (
        registration_status IN ('NOT_REGISTERED', 'IN_PROGRESS', 'COMPLETED')
    ),
    face_status              VARCHAR(20)  NOT NULL DEFAULT 'NOT_REGISTERED' CHECK (
        face_status IN ('NOT_REGISTERED', 'REGISTERED')
    ),
    registration_timestamp   TIMESTAMP,
    is_active                 BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. face_samples
--     Multiple face samples per face_data record if required
-- ============================================================
CREATE TABLE face_samples (
    id              BIGSERIAL PRIMARY KEY,
    face_data_id    BIGINT       NOT NULL REFERENCES face_data(id) ON DELETE CASCADE,
    image_path      VARCHAR(500),
    sample_index    INTEGER,
    captured_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. attendance_sessions
--     Represents a teacher starting attendance for a class+subject
--     Multiple teachers/classes can take attendance simultaneously
-- ============================================================
CREATE TABLE attendance_sessions (
    id              BIGSERIAL PRIMARY KEY,
    timetable_slot_id BIGINT       NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
    class_id        BIGINT       NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    subject_id      BIGINT       NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    teacher_id      VARCHAR(50)  NOT NULL REFERENCES teachers(teacher_id) ON DELETE RESTRICT,
    session_date    DATE         NOT NULL,
    start_time      TIME         NOT NULL,
    end_time        TIME         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED' CHECK (
        status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED')
    ),
    present_count   INTEGER      DEFAULT 0,
    absent_count    INTEGER      DEFAULT 0,
    late_count      INTEGER      DEFAULT 0,
    total_students  INTEGER      DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_session_slot_date UNIQUE (timetable_slot_id, session_date)
);

-- ============================================================
-- 14. attendance_records
--     Individual student attendance records per session
-- ============================================================
CREATE TABLE attendance_records (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT       NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id      VARCHAR(50)  NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    status          VARCHAR(20)  NOT NULL CHECK (
        status IN ('PRESENT', 'LATE', 'ABSENT')
    ),
    confidence_score DOUBLE PRECISION,
    marked_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    marked_by       VARCHAR(50) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_record_session_student UNIQUE (session_id, student_id)
);

-- ============================================================
-- 15. attendance_correction_requests
-- ============================================================
CREATE TABLE attendance_correction_requests (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT       NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id      VARCHAR(50)  NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    teacher_id      VARCHAR(50)  NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    current_status   VARCHAR(20)  NOT NULL,
    requested_status VARCHAR(20)  NOT NULL,
    reason          VARCHAR(500) NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_remarks   VARCHAR(500),
    reviewed_at     TIMESTAMP,
    reviewed_by     VARCHAR(100),
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 16. attendance_audit_logs
-- ============================================================
CREATE TABLE attendance_audit_logs (
    id                BIGSERIAL PRIMARY KEY,
    session_id        BIGINT       NOT NULL,
    student_id        VARCHAR(50)  NOT NULL,
    previous_status   VARCHAR(20)  NOT NULL,
    new_status        VARCHAR(20)  NOT NULL,
    modified_by       VARCHAR(100) NOT NULL,
    modification_type VARCHAR(50)  NOT NULL,
    remarks           VARCHAR(500),
    log_timestamp     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes for efficient queries
-- ============================================================
CREATE INDEX idx_students_class_id         ON students(class_id);
CREATE INDEX idx_students_academic_year     ON students(academic_year_id);
CREATE INDEX idx_teachers_department        ON teachers(department_id);
CREATE INDEX idx_timetable_class_day        ON timetable_slots(class_id, day_of_week);
CREATE INDEX idx_timetable_teacher          ON timetable_slots(teacher_id);
CREATE INDEX idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_sessions_date   ON attendance_sessions(session_date);
CREATE INDEX idx_attendance_sessions_class  ON attendance_sessions(class_id);
CREATE INDEX idx_attendance_sessions_status ON attendance_sessions(status);
CREATE INDEX idx_teacher_class_teacher      ON teacher_class_assignments(teacher_id);
CREATE INDEX idx_teacher_subject_teacher    ON teacher_subject_assignments(teacher_id);
CREATE INDEX idx_correction_requests_session ON attendance_correction_requests(session_id);
CREATE INDEX idx_correction_requests_teacher ON attendance_correction_requests(teacher_id);
CREATE INDEX idx_audit_logs_session         ON attendance_audit_logs(session_id);
CREATE INDEX idx_audit_logs_student         ON attendance_audit_logs(student_id);
