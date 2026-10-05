# FRAS V2 --- Student Portal Final Plan

**Project:** Face Recognition Attendance System (FRAS V2)\
**Module:** Student Portal\
**Database:** PostgreSQL\
**Backend direction:** Java Spring Boot + JPA/Hibernate\
**Portal access:** Authenticated students only

> This document defines the final scope for the Student Portal. It is
> intended to be used as the implementation specification for the
> frontend, backend APIs, and PostgreSQL database.

------------------------------------------------------------------------

## 1. Student Portal Objective

The Student Portal allows each student to log in to an individual
account and view their own attendance.

The portal is **read-only for attendance**.

### Core requirements

1.  Individual student account and login.
2.  Student profile.
3.  Overall attendance percentage.
4.  Subject-wise attendance.
5.  Monthly attendance.
6.  Semester-wise attendance.
7.  Detailed attendance history.
8.  Attendance calendar.
9.  Attendance status/target indicators.
10. Secure access so a student can view only their own data.

------------------------------------------------------------------------

# 2. Final Student Portal Navigation

``` text
STUDENT PORTAL
│
├── 🏠 Dashboard
│
├── 📊 Attendance
│   ├── Subject-wise
│   ├── Monthly
│   ├── Semester-wise
│   └── Attendance History
│
├── 📅 Calendar
│
├── 👤 Profile
│
└── ⚙ Settings
    ├── Change Password
    └── Logout
```

### Recommended bottom/side navigation

``` text
┌─────────────────────────────────────────────┐
│  🏠 Dashboard                               │
│  📊 Attendance                              │
│  📅 Calendar                                │
│  👤 Profile                                 │
│  ⚙ Settings                                 │
└─────────────────────────────────────────────┘
```

Keep the navigation small. Do not create separate top-level pages for
every attendance calculation.

------------------------------------------------------------------------

# 3. Authentication

## Student Login

``` text
Student
   ↓
Login Page
   ↓
Student ID / Email + Password
   ↓
Authentication API
   ↓
Validate credentials
   ↓
Create authenticated session/JWT
   ↓
Student Dashboard
```

### Login fields

-   Student ID or registered email
-   Password
-   Show/hide password
-   Login button
-   Forgot password

### Security requirements

-   Store only a password hash, never the plain password.
-   Use BCrypt/Argon2-compatible password hashing.
-   Use JWT or secure server-side session authentication.
-   Every protected API must identify the authenticated student from the
    authentication context.
-   Do not trust a `student_id` supplied by the frontend for
    authorization.
-   Students must not be able to edit attendance.
-   Students must not be able to access another student's attendance by
    changing an ID in a request.

------------------------------------------------------------------------

# 4. Dashboard --- Final UI

The dashboard should provide a quick summary rather than showing every
attendance record.

``` text
┌──────────────────────────────────────────────┐
│ ☰  STUDENT DASHBOARD                    👤  │
├──────────────────────────────────────────────┤
│                                              │
│  Welcome, [Student Name]                     │
│  [Student ID] • CSE • IV Year • Section A   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │          OVERALL ATTENDANCE            │  │
│  │               86.7%                    │  │
│  │        ████████████████░░              │  │
│  │        185 Present / 213 Classes       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  SUBJECT-WISE ATTENDANCE                     │
│                                              │
│  DBMS                    92%      ✅         │
│  ██████████████████░░                       │
│  46 / 50 classes                             │
│                                              │
│  Data Structures         86%      ✅         │
│  █████████████████░░░                       │
│  39 / 45 classes                             │
│                                              │
│  Operating Systems       72%      ⚠️         │
│  ██████████████░░░░░░                       │
│  29 / 40 classes                             │
│                                              │
│        [ View All Subjects → ]               │
│                                              │
│  THIS MONTH                                  │
│  October 2026                                │
│  Present: 39     Absent: 6                   │
│  Monthly Attendance: 86.7%                   │
│                                              │
│        [ View Monthly Details → ]            │
│                                              │
└──────────────────────────────────────────────┘
```

## Dashboard must show

-   Student name
-   Student ID
-   Department
-   Year
-   Section
-   Current semester
-   Overall attendance percentage
-   Total classes
-   Present classes
-   Absent classes
-   Subject-wise summary
-   Current-month summary
-   Attendance status

------------------------------------------------------------------------

# 5. Attendance Status

Use a configurable attendance target.

Default target:

``` text
75%
```

### Status logic

  Attendance      Status
  --------------- -----------
  \>= 90%         Excellent
  75% -- 89.99%   On Track
  65% -- 74.99%   At Risk
  \< 65%          Critical

Do not hard-code the target permanently into the frontend. The backend
should provide the target/configuration.

------------------------------------------------------------------------

# 6. Subject-wise Attendance

## Page

``` text
ATTENDANCE
│
└── SUBJECT-WISE

Semester: [ Current Semester ▼ ]

┌────────────────────────────────────────────┐
│ DBMS                                       │
│ Database Management Systems                │
│                                            │
│ Attendance: 92%                            │
│ ██████████████████░░                       │
│                                            │
│ Present: 46                                │
│ Absent: 4                                  │
│ Total: 50                                  │
│ Status: ✅ On Track                        │
│                                            │
│ [ View Details → ]                         │
└────────────────────────────────────────────┘
```

### Subject card

Each subject should display:

-   Subject code
-   Subject name
-   Attendance percentage
-   Present count
-   Absent count
-   Total classes
-   Status
-   Optional "classes can miss / classes required" calculation
-   Link to detailed history

------------------------------------------------------------------------

# 7. Subject Detailed Attendance

When a student opens a subject:

``` text
┌────────────────────────────────────────────┐
│ ← Back       DBMS                           │
├────────────────────────────────────────────┤
│ Database Management Systems                 │
│ Subject Code: CSXXXX                       │
│                                            │
│ Attendance: 92%                            │
│ Present: 46 | Absent: 4 | Total: 50      │
│                                            │
│ October 2026                               │
│                                            │
│ Date          Status                       │
│ 01-10-2026    ✅ Present                   │
│ 02-10-2026    — No Class                   │
│ 03-10-2026    ❌ Absent                    │
│ ...                                        │
└────────────────────────────────────────────┘
```

The detailed view should use actual attendance records from PostgreSQL.

------------------------------------------------------------------------

# 8. Monthly Attendance

The monthly page shows attendance for a selected month.

``` text
MONTHLY ATTENDANCE

[ ◀ ] October 2026 [ ▶ ]

Total Classes: 45
Present: 39
Absent: 6

Monthly Attendance: 86.67%
█████████████████░░░

Subject-wise:

DBMS                 90%
Data Structures      92%
Operating Systems    73%
Computer Networks    92%
```

## Monthly filters

-   Month
-   Year
-   Current semester/academic year where applicable

## Optional enhancement

Week-wise breakdown:

``` text
Week 1    90%
Week 2    92%
Week 3    78%
Week 4    95%
```

This should be added only if it provides useful information from the
underlying attendance data.

------------------------------------------------------------------------

# 9. Semester-wise Attendance

The semester page provides historical attendance.

``` text
SEMESTER-WISE ATTENDANCE

┌────────────────────────────────────────────┐
│ Semester 8                                 │
│ Academic Year: 2028-2029                   │
│ Attendance: 86.8%                          │
│ Present: 185 / 213                         │
│ Status: Completed                          │
│                                            │
│ [ View Subject Breakdown → ]               │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ Semester 7                                 │
│ Academic Year: 2028-2029                   │
│ Attendance: 88.5%                          │
│ Present: 212 / 240                         │
│ Status: Completed                          │
│                                            │
│ [ View Subject Breakdown → ]               │
└────────────────────────────────────────────┘
```

The current semester should be clearly marked.

------------------------------------------------------------------------

# 10. Attendance Calendar

The Calendar page gives a date-oriented view.

``` text
             OCTOBER 2026

Mon  Tue  Wed  Thu  Fri  Sat  Sun
                 1    2    3    4
     🟢   🟢   🔴   🟢   🟢   -
 5   🟢   🟢   🟢   🟢   🔴   -   -
...
```

### Legend

``` text
🟢 Present
🔴 Absent
🟡 Partial / other configured status
⚪ No class
```

Tapping a date should show the subjects conducted on that date and the
student's attendance status.

------------------------------------------------------------------------

# 11. Profile

``` text
PROFILE

[Student Photo]

Name:          Shafiq Ahamed
Student ID:    CS2024001
Email:         student@example.com
Department:    Computer Science & Engineering
Year:          IV Year
Section:       A
Current Sem:   8
Phone:         **********
```

### Student-editable fields

Only fields explicitly permitted by the institution should be editable.

Recommended:

-   Phone number
-   Email, if verification is implemented
-   Password

Academic information should generally be controlled by Admin.

------------------------------------------------------------------------

# 12. Settings

``` text
SETTINGS

Account
  ├── Change Password
  └── Logout

Preferences
  ├── Theme
  └── Notification Preferences
```

Do not add unnecessary settings in the first version.

------------------------------------------------------------------------

# 13. PostgreSQL Data Model

The Student Portal should depend on the central attendance database.

## Main tables

``` text
users
students
teachers
subjects
semesters
student_subjects
attendance
```

### Relationship

``` text
                    users
                      │
             ┌────────┴────────┐
             ↓                 ↓
         students          teachers
             │                 │
             │                 │
             ↓                 │
     student_subjects         │
             │                 │
             ↓                 ↓
          subjects        marked_by
             │                 │
             └────────┬────────┘
                      ↓
                  attendance
```

------------------------------------------------------------------------

# 14. `users` Table

Authentication should be separated from student academic data.

``` sql
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

------------------------------------------------------------------------

# 15. `students` Table

``` sql
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year INTEGER,
    section VARCHAR(20),
    phone VARCHAR(20),

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);
```

------------------------------------------------------------------------

# 16. `subjects` Table

``` sql
CREATE TABLE subjects (
    subject_id VARCHAR(30) PRIMARY KEY,
    subject_code VARCHAR(30) UNIQUE NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL,
    credits INTEGER
);
```

------------------------------------------------------------------------

# 17. `student_subjects` Table

This represents which subjects a student is enrolled in.

``` sql
CREATE TABLE student_subjects (
    student_id VARCHAR(20) NOT NULL,
    subject_id VARCHAR(30) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,

    PRIMARY KEY (student_id, subject_id, academic_year),

    FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id)
);
```

------------------------------------------------------------------------

# 18. `attendance` Table

``` sql
CREATE TABLE attendance (
    attendance_id BIGSERIAL PRIMARY KEY,

    student_id VARCHAR(20) NOT NULL,
    subject_id VARCHAR(30) NOT NULL,

    attendance_date DATE NOT NULL,

    status VARCHAR(10) NOT NULL
        CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE')),

    marked_by BIGINT,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id),

    FOREIGN KEY (marked_by)
        REFERENCES users(user_id),

    UNIQUE (student_id, subject_id, attendance_date)
);
```

### Important

Do **not** create separate physical tables such as:

``` text
monthly_attendance
semester_attendance
subject_attendance
```

Attendance should have one source of truth.

Monthly, subject-wise, and semester-wise values should be calculated
from the attendance records.

------------------------------------------------------------------------

# 19. Attendance Calculation

## Subject-wise

``` text
attendance_percentage =
present_classes / total_classes × 100
```

Example:

``` text
Present = 46
Total = 50

46 / 50 × 100 = 92%
```

## Monthly

Filter attendance by:

``` text
student_id
+
date range
```

## Semester

Filter attendance using:

``` text
student_id
+
semester/academic enrollment
```

The backend should perform these calculations rather than trusting
values sent by the frontend.

------------------------------------------------------------------------

# 20. PostgreSQL Query --- Subject-wise

``` sql
SELECT
    s.subject_id,
    s.subject_code,
    s.subject_name,
    COUNT(*) AS total_classes,
    COUNT(*) FILTER (
        WHERE a.status = 'PRESENT'
    ) AS present_classes,
    COUNT(*) FILTER (
        WHERE a.status = 'ABSENT'
    ) AS absent_classes,
    ROUND(
        COUNT(*) FILTER (WHERE a.status = 'PRESENT')
        * 100.0 / NULLIF(COUNT(*), 0),
        2
    ) AS attendance_percentage
FROM attendance a
JOIN subjects s
    ON s.subject_id = a.subject_id
WHERE a.student_id = :studentId
GROUP BY
    s.subject_id,
    s.subject_code,
    s.subject_name
ORDER BY s.subject_name;
```

------------------------------------------------------------------------

# 21. PostgreSQL Query --- Monthly

``` sql
SELECT
    DATE_TRUNC('month', attendance_date)::DATE AS month,
    COUNT(*) AS total_classes,
    COUNT(*) FILTER (
        WHERE status = 'PRESENT'
    ) AS present_classes,
    COUNT(*) FILTER (
        WHERE status = 'ABSENT'
    ) AS absent_classes,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'PRESENT')
        * 100.0 / NULLIF(COUNT(*), 0),
        2
    ) AS attendance_percentage
FROM attendance
WHERE student_id = :studentId
GROUP BY DATE_TRUNC('month', attendance_date)
ORDER BY month DESC;
```

------------------------------------------------------------------------

# 22. Backend API Plan

The frontend should communicate with the backend through REST APIs.

## Authentication

``` text
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout
```

## Student

``` text
GET /api/student/me
GET /api/student/profile
PUT /api/student/profile
```

## Dashboard

``` text
GET /api/student/dashboard
```

The dashboard endpoint can return:

``` json
{
  "student": {},
  "overallAttendance": {},
  "currentMonth": {},
  "subjects": []
}
```

## Attendance

``` text
GET /api/student/attendance
GET /api/student/attendance/subjects
GET /api/student/attendance/subjects/{subjectId}
GET /api/student/attendance/monthly
GET /api/student/attendance/semester
GET /api/student/attendance/calendar
```

### Important authorization rule

The API should use the authenticated user's identity.

Avoid:

``` text
GET /api/student/attendance?studentId=CS2024002
```

as the primary security mechanism.

Instead:

``` text
Authenticated JWT
       ↓
Extract user_id
       ↓
Find linked student
       ↓
Query attendance for that student
```

This prevents ID manipulation.

------------------------------------------------------------------------

# 23. Suggested API Response

## Dashboard

``` json
{
  "student": {
    "studentId": "CS2024001",
    "name": "Shafiq Ahamed",
    "department": "Computer Science and Engineering",
    "year": 4,
    "section": "A",
    "semester": 8
  },
  "overallAttendance": {
    "totalClasses": 213,
    "presentClasses": 185,
    "absentClasses": 28,
    "percentage": 86.85,
    "status": "ON_TRACK"
  },
  "currentMonth": {
    "month": "2026-10",
    "totalClasses": 45,
    "presentClasses": 39,
    "absentClasses": 6,
    "percentage": 86.67
  },
  "subjects": []
}
```

------------------------------------------------------------------------

# 24. Attendance Calculator

This is a useful secondary feature.

### If attendance is above target

Example:

``` text
Current attendance: 86.7%
Target: 75%

You can miss X additional classes
while remaining at or above 75%.
```

### If attendance is below target

``` text
Current attendance: 72%
Target: 75%

You need to attend X consecutive classes
to reach 75%.
```

These calculations should be performed by the backend/service layer.

Do not store the calculated value permanently in PostgreSQL.

------------------------------------------------------------------------

# 25. Face Recognition Relationship

The Student Portal is **not responsible for face recognition**.

The overall system is:

``` text
                FACE RECOGNITION
                       │
                       ↓
                 Identify Student
                       │
                       ↓
                Teacher Attendance
                       │
                       ↓
                PostgreSQL
                       │
                       ↓
                Student Portal
                       │
                       ↓
              Display Attendance
```

The student portal consumes attendance records created through the
attendance workflow.

Students should not have an API that directly inserts attendance
records.

------------------------------------------------------------------------

# 26. Permissions

  Feature                             Student               Teacher   Admin
  ----------------------- ------------------- --------------------- -------
  Login                                    ✅                    ✅      ✅
  View own profile                         ✅                    ✅      ✅
  Edit academic details                    ❌                    ❌      ✅
  View own attendance                      ✅                   ---     ---
  Edit attendance                          ❌                    ✅      ✅
  View all students                        ❌   Based on permission      ✅
  Manage subjects                          ❌         ❌/permission      ✅
  Manage students                          ❌                    ❌      ✅
  Manage teachers                          ❌                    ❌      ✅
  Face registration         ❌/Admin workflow       Based on design      ✅

------------------------------------------------------------------------

# 27. Security Rules

## Mandatory

1.  Passwords must be hashed.
2.  Authentication is required for all student APIs.
3.  Student APIs must enforce ownership.
4.  Attendance is read-only for students.
5.  Use HTTPS in production.
6.  Validate all request parameters.
7.  Use JPA parameter binding/prepared queries.
8.  Do not expose password hashes through APIs.
9.  Do not expose internal database IDs unnecessarily.
10. Log security-sensitive events.
11. Implement session/JWT expiration.
12. Provide logout/token invalidation strategy appropriate to the
    authentication architecture.

------------------------------------------------------------------------

# 28. Performance and Database Indexes

As attendance grows, indexes become important.

Recommended:

``` sql
CREATE INDEX idx_attendance_student
ON attendance(student_id);

CREATE INDEX idx_attendance_student_date
ON attendance(student_id, attendance_date);

CREATE INDEX idx_attendance_student_subject
ON attendance(student_id, subject_id);

CREATE INDEX idx_attendance_subject_date
ON attendance(subject_id, attendance_date);
```

These support the main Student Portal queries.

------------------------------------------------------------------------

# 29. Frontend Page Structure

Recommended structure:

``` text
student/
│
├── login
│
├── dashboard
│
├── attendance
│   ├── subject-wise
│   ├── subject-detail
│   ├── monthly
│   ├── semester-wise
│   └── history
│
├── calendar
│
├── profile
│
└── settings
```

Do not duplicate attendance calculation logic across multiple pages.

Use one API/service layer.

------------------------------------------------------------------------

# 30. Backend Structure

For Spring Boot:

``` text
student/
│
├── controller/
│   └── StudentController
│
├── service/
│   ├── StudentService
│   └── StudentAttendanceService
│
├── repository/
│   ├── StudentRepository
│   ├── AttendanceRepository
│   ├── SubjectRepository
│   └── StudentSubjectRepository
│
├── entity/
│   ├── Student
│   ├── Attendance
│   ├── Subject
│   ├── StudentSubject
│   └── User
│
└── dto/
    ├── StudentProfileResponse
    ├── DashboardResponse
    ├── SubjectAttendanceResponse
    ├── MonthlyAttendanceResponse
    └── SemesterAttendanceResponse
```

------------------------------------------------------------------------

# 31. Development Order

Build the Student Portal in this order.

## Phase 1 --- Database

-   Create `users`
-   Create `students`
-   Create `subjects`
-   Create `student_subjects`
-   Create `attendance`
-   Create required relationships
-   Add indexes
-   Insert test data

## Phase 2 --- Authentication

-   Student login
-   Password hashing
-   JWT/session
-   Role verification
-   Protected endpoints
-   Logout

## Phase 3 --- Student Profile

-   Get current student
-   Display profile
-   Update permitted profile fields

## Phase 4 --- Dashboard

-   Overall attendance
-   Current-month attendance
-   Subject-wise summary
-   Status calculation

## Phase 5 --- Attendance Reports

-   Subject-wise
-   Subject detail
-   Monthly
-   Semester-wise
-   Attendance history

## Phase 6 --- Calendar

-   Monthly calendar
-   Date-level attendance
-   Subject information for selected date

## Phase 7 --- Security Testing

Test:

``` text
Student A → Student A data       ✅
Student A → Student B data       ❌
Student → Edit attendance        ❌
Student → Insert attendance      ❌
Student → Delete attendance      ❌
Unauthenticated → Dashboard      ❌
Expired token → Dashboard        ❌
```

## Phase 8 --- UI Refinement

-   Responsive layout
-   Loading states
-   Empty states
-   Error handling
-   Mobile layout
-   Accessibility
-   Final visual design

------------------------------------------------------------------------

# 32. MVP vs Future Features

## MVP --- Build Now

``` text
✅ Student login
✅ Student profile
✅ Dashboard
✅ Overall attendance
✅ Subject-wise attendance
✅ Monthly attendance
✅ Semester-wise attendance
✅ Attendance history
✅ Calendar
✅ Read-only access
✅ PostgreSQL integration
✅ Role-based authorization
```

## Phase 2 --- Add Later

``` text
○ Attendance calculator
○ Low-attendance notification
○ Email/OTP notifications
○ PDF report
○ Excel export
○ Attendance trends
○ Custom attendance target
○ Dark mode
```

Do not allow Phase 2 features to delay the core Student Portal.

------------------------------------------------------------------------

# 33. Final Student Portal Flow

``` text
                         STUDENT
                            │
                            ↓
                         LOGIN
                            │
                    ┌───────┴───────┐
                    │ Authentication │
                    └───────┬───────┘
                            ↓
                       DASHBOARD
                            │
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
       SUBJECT            MONTH             SEMESTER
       ATTENDANCE        ATTENDANCE         ATTENDANCE
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ↓
                      ATTENDANCE DATA
                            │
                            ↓
                       POSTGRESQL
                            ↑
                            │
                 Teacher / Face Recognition
```

------------------------------------------------------------------------

# 34. Final Scope Decision

The Student Portal should be a **read-only attendance and academic
information portal**, not another attendance-management system.

### The final dashboard has four core attendance views:

``` text
1. OVERALL
   ↓
   Current total attendance

2. SUBJECT-WISE
   ↓
   Attendance for every subject

3. MONTHLY
   ↓
   Attendance grouped by month

4. SEMESTER-WISE
   ↓
   Historical attendance by semester
```

All four views originate from the same PostgreSQL attendance records.

### Source-of-truth principle

``` text
                 PostgreSQL
                     │
              attendance table
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    Subject        Monthly      Semester
    calculation   calculation  calculation
        │            │            │
        └────────────┼────────────┘
                     ↓
              Student Portal
```

This keeps the Student Portal simple, secure, and consistent with the
overall FRAS V2 architecture.

------------------------------------------------------------------------

## 35. Implementation Acceptance Checklist

The Student Portal is complete only when all of the following are true:

-   [ ] Student can log in.
-   [ ] Student can see only their own data.
-   [ ] Dashboard loads from PostgreSQL.
-   [ ] Overall percentage is calculated correctly.
-   [ ] Subject-wise percentages are correct.
-   [ ] Monthly percentages are correct.
-   [ ] Semester percentages are correct.
-   [ ] Attendance history is available.
-   [ ] Calendar reflects attendance records.
-   [ ] Student cannot modify attendance.
-   [ ] Student cannot access another student's records.
-   [ ] Password is never returned by an API.
-   [ ] Protected endpoints reject unauthenticated requests.
-   [ ] Database constraints prevent duplicate attendance.
-   [ ] Main attendance queries have appropriate indexes.
-   [ ] Frontend handles loading, empty, and error states.
-   [ ] Backend calculations are the source of truth.

------------------------------------------------------------------------

## Final Architecture

``` text
┌─────────────────────────────────────────────────────┐
│                 STUDENT PORTAL                      │
│                                                     │
│  Login → Dashboard → Attendance → Calendar → Profile│
└────────────────────────┬────────────────────────────┘
                         │ REST API
                         ↓
┌─────────────────────────────────────────────────────┐
│              SPRING BOOT BACKEND                    │
│                                                     │
│ Auth │ Student │ Attendance │ Subject │ Semester   │
│                                                     │
│ JWT/Security │ Services │ Repositories │ DTOs      │
└────────────────────────┬────────────────────────────┘
                         │ JPA/Hibernate
                         ↓
┌─────────────────────────────────────────────────────┐
│                   POSTGRESQL                        │
│                                                     │
│ users                                               │
│ students                                            │
│ teachers                                            │
│ subjects                                            │
│ student_subjects                                    │
│ semesters                                           │
│ attendance                                          │
└────────────────────────┬────────────────────────────┘
                         ↑
                         │
                 Attendance Creation
                         │
             ┌───────────┴───────────┐
             │                       │
        Teacher Workflow       Face Recognition
```

**This is the final recommended scope for implementing the Student
Portal.**
