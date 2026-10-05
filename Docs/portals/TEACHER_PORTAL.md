# FRAS V2 --- Teacher Portal Specification

## 1. Purpose

The Teacher Portal is the teacher-facing module of FRAS V2 (Face
Recognition Attendance System V2).

Its primary responsibility is to allow authenticated teachers to manage
their assigned academic information and conduct attendance through face
recognition and manual workflows.

This document combines the detailed Teacher Portal implementation
specification with the **Final Teacher Plan**. This document is the
authoritative functional and UI scope for the Teacher Portal.

------------------------------------------------------------------------

# 2. Final Teacher Module Structure

``` text
TEACHER
│
├── 🔐 Login
│   ├── Teacher ID / Email
│   ├── Password
│   └── Forgot Password
│       └── OTP-based Reset
│
├── 🏠 Dashboard
│   ├── Assigned Classes
│   ├── Assigned Subjects
│   ├── Today's Classes
│   ├── Today's Attendance Summary
│   └── Quick Start Attendance
│
├── 🏫 My Classes
│   ├── View Assigned Classes
│   ├── Select Class / Section
│   └── View Students
│
├── 📚 My Subjects
│   ├── View Assigned Subjects
│   └── Subject Details
│
├── 👨‍🎓 Student List
│   ├── Select Class / Section
│   ├── View Students
│   ├── Student Details
│   └── Attendance Summary
│
├── 📸 Attendance
│   │
│   ├── Start Attendance
│   │   ├── Select Class
│   │   ├── Select Subject
│   │   └── Start Session
│   │
│   ├── Face Recognition
│   │   ├── Camera ON
│   │   ├── Detect Multiple Faces
│   │   ├── Recognize Students
│   │   ├── Multi-frame Confirmation
│   │   ├── Unknown Face Handling
│   │   └── Duplicate Prevention
│   │
│   ├── Force Manual Attendance
│   │
│   ├── Manual Attendance
│   │   ├── Mark Present
│   │   └── Mark Absent
│   │
│   ├── Mark All Present
│   │
│   ├── Review Attendance
│   │   ├── Present Students
│   │   ├── Absent Students
│   │   └── Manual Corrections
│   │
│   └── Submit Attendance
│       └── Lock Attendance
│
├── 📋 Attendance History
│   ├── Date-wise
│   ├── Class-wise
│   ├── Subject-wise
│   └── Session Details
│
├── 📊 Attendance Reports
│   ├── Class Attendance
│   ├── Subject Attendance
│   ├── Student-wise Attendance
│   ├── Date-wise Reports
│   └── Export Reports
│
└── 👤 Profile
    ├── View Profile
    ├── Change Password
    └── Logout
```

------------------------------------------------------------------------

# 3. Locked Attendance --- Final Business Rule

Once attendance is submitted, it becomes locked.

``` text
Attendance Submitted
        ↓
Attendance Locked
        ↓
Teacher finds an error
        ↓
Send Correction Request
        ↓
Admin Reviews
        ↓
Admin Approves
        ↓
Attendance Modified
        ↓
Audit Log
```

### Rule

**Teacher cannot directly modify locked attendance.**

A teacher may only submit a correction request after attendance is
locked.

The Admin is responsible for reviewing and approving correction
requests.

Approved modifications must be recorded in the audit log.

------------------------------------------------------------------------

# 4. Teacher Permissions

  Feature                      Teacher
  ---------------------------- ---------
  View assigned classes        ✅
  View assigned subjects       ✅
  View students                ✅
  Start attendance             ✅
  Face recognition             ✅
  Force manual attendance      ✅
  Manual attendance            ✅
  Mark all present             ✅
  Review attendance            ✅
  Submit & lock                ✅
  Attendance history           ✅
  Reports                      ✅
  Correction request           ✅
  Delete students              ❌
  Manage face data             ❌
  Add/remove teachers          ❌
  Approve correction request   ❌

Backend authorization must enforce these permissions. Frontend
visibility alone is not security.

------------------------------------------------------------------------

# 5. Core Implementation Principles

Before changing or creating frontend code:

1.  Inspect the existing frontend and backend only as necessary.
2.  Inspect existing routes, components, services, API clients,
    authentication logic, and styling.
3.  Reuse existing architecture where appropriate.
4.  Do not replace working architecture without a clear reason.
5.  Do not invent backend APIs.
6.  Do not invent database fields or response formats.
7.  Do not create fake production data.
8.  Verify planned APIs against the actual backend before using them.
9.  Keep frontend and backend responsibilities separate.
10. Backend authorization is authoritative.
11. Do not expose sensitive face data in the frontend.
12. Do not modify unrelated modules unnecessarily.

------------------------------------------------------------------------

# 6. Authentication

## Login

Teacher login must support:

-   Teacher ID / Email
-   Password

Use the existing authentication architecture.

Do not create a second authentication system if one already exists.

## Forgot Password

The planned flow is:

``` text
Forgot Password
      ↓
Identify Teacher
      ↓
OTP
      ↓
Verify OTP
      ↓
New Password
      ↓
Login
```

OTP implementation must use the actual backend authentication contract.

Do not fake OTP verification in the frontend.

## Logout

Logout must use the existing authentication/session mechanism.

------------------------------------------------------------------------

# 7. Teacher Dashboard

The dashboard should answer:

> "What do I need to do today?"

## Dashboard sections

### Assigned Classes

Display the teacher's assigned classes.

### Assigned Subjects

Display assigned subjects.

### Today's Classes

Display:

-   Time
-   Class
-   Subject
-   Attendance status
-   Action

### Today's Attendance Summary

Show actual backend data where available.

Possible information:

-   Sessions completed
-   Present/absent summary
-   Attendance percentage

Do not fabricate numbers.

### Quick Start Attendance

Provide a direct action to start an authorized attendance session.

------------------------------------------------------------------------

# 8. My Classes

Display classes assigned to the logged-in teacher.

## Functions

-   View assigned classes.
-   Select Class / Section.
-   View students.

Only authorized classes should be displayed.

## Student View

From a class, the teacher can view the student list.

The teacher may view:

-   Student identity information supported by the backend.
-   Attendance summary where supported.

The teacher must not delete students.

------------------------------------------------------------------------

# 9. My Subjects

Display subjects assigned to the teacher.

## Functions

-   View assigned subjects.
-   View subject details.

Possible information:

-   Subject code
-   Subject name
-   Semester
-   Assigned class
-   Academic year

Use actual backend data.

------------------------------------------------------------------------

# 10. Student List

The Student List is a dedicated teacher-facing student view.

## Flow

``` text
Student List
    ↓
Select Class / Section
    ↓
View Students
    ↓
Select Student
    ↓
Student Details
    ↓
Attendance Summary
```

## Student Details

Display only information authorized and supported by the backend.

Possible information:

-   Name
-   Register number
-   Student ID
-   Contact information where permitted
-   Attendance summary

Do not expose face embeddings or raw biometric data.

------------------------------------------------------------------------

# 11. Attendance --- Overall Workflow

Attendance is the central Teacher Portal workflow.

``` text
Teacher
  ↓
Start Attendance
  ↓
Select Class
  ↓
Select Subject
  ↓
Start Session
  ↓
Face Recognition / Manual Attendance
  ↓
Review Attendance
  ↓
Manual Corrections
  ↓
Submit Attendance
  ↓
Lock Attendance
```

Attendance should be implemented as a guided workflow rather than one
large page.

------------------------------------------------------------------------

# 12. Start Attendance

The teacher must be able to:

-   Select Class.
-   Select Subject.
-   Start Session.

Only authorized class/subject combinations should be available.

## Validation

Before starting:

-   Required selections must exist.
-   Class must be authorized.
-   Subject must be authorized.
-   Class/subject combination must be valid.
-   Duplicate/conflicting sessions must be handled according to backend
    rules.

Do not implement frontend business rules that contradict the backend.

------------------------------------------------------------------------

# 13. Face Recognition

The face recognition workflow must support the planned requirements:

``` text
Camera ON
    ↓
Detect Multiple Faces
    ↓
Recognize Students
    ↓
Multi-frame Confirmation
    ↓
Unknown Face Handling
    ↓
Duplicate Prevention
```

## Camera

Handle:

-   Permission request.
-   Permission denied.
-   Camera loading.
-   Camera active.
-   Camera unavailable.
-   Recognition processing.
-   Recognition service/API failure.

## Multiple faces

The interface must support detecting multiple faces when the
backend/recognition system supports it.

## Multi-frame confirmation

Recognition should not be treated as final merely because a face is
detected once.

Use the actual backend recognition contract and business logic for
confirmation.

Do not invent confidence thresholds if they are not defined by the
system.

## Unknown faces

Unknown/unrecognized faces must not be automatically assigned to a
student.

Display an appropriate unknown/unrecognized state.

## Duplicate prevention

A student already marked present during the active session must not be
repeatedly added as a new attendance record.

The backend remains the final authority for duplicate prevention.

------------------------------------------------------------------------

# 14. Force Manual Attendance

The teacher must be able to use a manual attendance mode when face
recognition cannot be used or when the teacher intentionally chooses the
supported manual workflow.

The UI must clearly distinguish:

-   Face Recognition attendance
-   Manual attendance

The actual availability of this feature must follow backend rules.

------------------------------------------------------------------------

# 15. Manual Attendance

Manual attendance must support:

-   Mark Present
-   Mark Absent

The teacher should be able to search/filter students where useful.

Manual changes must update the current session state correctly.

Unsaved changes must not be silently discarded.

------------------------------------------------------------------------

# 16. Mark All Present

Provide a **Mark All Present** action when supported.

Before applying it:

-   Clearly indicate what will happen.
-   Avoid accidental activation.
-   Respect backend/session rules.

The teacher must still be able to review and correct individual students
before submission.

------------------------------------------------------------------------

# 17. Review Attendance

The review page is the teacher's verification step.

## Summary

Show:

-   Total students
-   Present students
-   Absent students
-   Other backend-supported states

## Student sections

Display:

-   Present Students
-   Absent Students

Provide:

-   Search
-   Manual corrections
-   Attendance status controls where permitted

The teacher must verify the attendance before submitting.

------------------------------------------------------------------------

# 18. Submit Attendance

The final action is:

**Submit Attendance**

Before submission:

-   Validate the session.
-   Prevent duplicate submission.
-   Warn about important missing/invalid attendance data where
    appropriate.

After successful submission:

``` text
Submitted
   ↓
Locked
```

The teacher should receive a clear confirmation.

------------------------------------------------------------------------

# 19. Attendance Lock

Once locked:

-   Normal editing is disabled.
-   Teacher cannot directly modify attendance.
-   Attendance becomes read-only for the teacher.

If an error is found:

``` text
Locked Attendance
       ↓
Correction Request
       ↓
Admin Review
```

The frontend must not provide direct edit controls for locked
attendance.

------------------------------------------------------------------------

# 20. Correction Request

Teacher can request a correction for locked attendance.

The request should identify the attendance session and relevant
correction information according to the backend contract.

Possible flow:

``` text
Teacher
   ↓
Open Locked Session
   ↓
Request Correction
   ↓
Provide Reason / Correction Details
   ↓
Submit Request
   ↓
Pending Admin Review
```

The teacher cannot approve their own correction request.

------------------------------------------------------------------------

# 21. Attendance History

Provide:

-   Date-wise history
-   Class-wise history
-   Subject-wise history
-   Session details

Possible session information:

-   Date
-   Class
-   Subject
-   Period
-   Attendance summary
-   Status

Locked sessions must remain read-only.

------------------------------------------------------------------------

# 22. Attendance Reports

Provide the reports supported by the backend:

-   Class Attendance
-   Subject Attendance
-   Student-wise Attendance
-   Date-wise Reports
-   Export Reports

## Filters

Use supported filters such as:

-   Class
-   Subject
-   Student
-   Date range

Do not expose data outside the teacher's authorization scope.

## Export

Implement export only if backend support exists.

Do not create fake export functionality.

------------------------------------------------------------------------

# 23. Profile

The Profile section must provide:

-   View Profile
-   Change Password
-   Logout

Possible profile information:

-   Teacher name
-   Teacher ID
-   Email
-   Department
-   Assigned classes
-   Assigned subjects

Use the existing authentication/account architecture for password
changes.

------------------------------------------------------------------------

# 24. Navigation

## Desktop

Use a sidebar.

Recommended:

``` text
Dashboard
Attendance
  ├── Start Attendance
  └── Attendance History
My Classes
My Subjects
Student List
Reports
Profile
```

## Mobile

Use a mobile-friendly navigation pattern.

Recommended primary navigation:

``` text
Home
Attendance
Reports
Profile
```

Secondary pages can be accessed through the appropriate section/menu.

------------------------------------------------------------------------

# 25. API Architecture

Use the project's existing API architecture.

Recommended flow:

``` text
UI
 ↓
Teacher API Service
 ↓
Shared API Client
 ↓
Spring Boot REST API
 ↓
PostgreSQL
```

Do not call APIs directly from every component when the project already
has an API/service layer.

## Planned teacher API areas

The project documentation previously identified API areas such as:

``` text
GET  /api/teacher/classes
GET  /api/teacher/subjects
GET  /api/teacher/timetable
GET  /api/teacher/attendance-sessions?teacherId=...
POST /api/teacher/attendance-sessions
POST /api/teacher/attendance-records
POST /api/teacher/attendance-recognition
```

These are planned contracts and must be verified against the actual
backend before implementation.

Do not assume these endpoints already exist.

If an API is missing:

1.  Identify the missing backend dependency.
2.  Do not invent the API response.
3.  Do not fake successful functionality.
4.  Record the dependency clearly.

------------------------------------------------------------------------

# 26. Authorization and Security

Teacher access must be restricted by backend authorization.

A teacher must only access:

-   Their assigned classes.
-   Their assigned subjects.
-   Authorized students.
-   Their permitted attendance sessions.
-   Their permitted reports.

Frontend route protection is useful but is not sufficient security.

Backend must enforce:

-   Authentication.
-   Teacher role.
-   Assignment ownership.
-   Class access.
-   Subject access.
-   Attendance access.
-   Correction-request permissions.

------------------------------------------------------------------------

# 27. Face Data Privacy

Teachers cannot manage face data.

The frontend must not:

-   Expose raw face embeddings.
-   Display stored face vectors.
-   Store biometric data in local storage.
-   Log biometric data.
-   Download face data unnecessarily.

Only the information required for attendance should be exposed.

------------------------------------------------------------------------

# 28. Responsive Design

The portal must support:

-   Desktop
-   Laptop
-   Tablet
-   Mobile

The attendance camera workflow is especially important on mobile/tablet.

Mobile requirements:

-   Large touch targets.
-   Efficient camera preview.
-   Easily accessible primary actions.
-   Responsive tables/cards.
-   Mobile navigation.
-   Appropriate mobile form controls.

Do not simply shrink the desktop interface.

------------------------------------------------------------------------

# 29. UI / UX Design

The visual style should be:

-   Modern
-   Clean
-   Professional
-   Academic/enterprise
-   Minimal
-   Responsive
-   Accessible

Avoid:

-   Excessive gradients.
-   Unnecessary animations.
-   Overcrowded dashboards.
-   Huge cards.
-   Decorative elements that reduce usability.
-   Fake metrics.
-   Unnecessary popups.

Attendance should prioritize speed and clarity.

Use the existing project design system if one already exists.

------------------------------------------------------------------------

# 30. Loading, Empty, Error and Permission States

Every data-driven page should handle:

### Loading

Use appropriate loading/skeleton states.

### Empty

Explain what is empty and provide an action where appropriate.

### Error

Show a useful user-facing error.

Do not expose raw stack traces.

### Unauthorized

Handle HTTP 401 according to the existing authentication flow.

### Forbidden

Handle HTTP 403 with a clear access-denied state.

### Not Found

Handle HTTP 404 appropriately.

### Network Failure

Provide retry where appropriate.

------------------------------------------------------------------------

# 31. Component Organization

Follow the existing project structure.

If an equivalent structure does not already exist, a possible structure
is:

``` text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── attendance/
│   ├── reports/
│   ├── students/
│   └── timetable/
│
├── pages/
│   ├── auth/
│   │   └── LoginPage
│   │
│   └── teacher/
│       ├── DashboardPage
│       ├── MyClassesPage
│       ├── MySubjectsPage
│       ├── StudentListPage
│       ├── ReportsPage
│       ├── ProfilePage
│       │
│       └── attendance/
│           ├── StartAttendancePage
│           ├── CameraCapturePage
│           ├── ManualAttendancePage
│           ├── AttendanceResultPage
│           ├── AttendanceReviewPage
│           ├── AttendanceHistoryPage
│           └── CorrectionRequestPage
│
├── features/
│   └── teacher/
│       └── teacherApi
│
├── services/
│   ├── api/
│   └── auth/
│
├── hooks/
├── routes/
├── types/
└── utils/
```

This is a reference structure, not a mandatory replacement for the
existing architecture.

------------------------------------------------------------------------

# 32. State Management

Reuse the project's existing state-management approach.

### Server state

Examples:

-   Classes
-   Subjects
-   Students
-   Timetable
-   Attendance sessions
-   Attendance records
-   Reports
-   Teacher profile

### Local UI state

Examples:

-   Selected class
-   Selected subject
-   Search text
-   Camera state
-   Temporary attendance corrections
-   Modal state

Avoid unnecessary duplication of server state.

------------------------------------------------------------------------

# 33. Error Prevention

Protect against:

-   Duplicate attendance sessions.
-   Duplicate recognition records.
-   Empty attendance submission.
-   Accidental session exit.
-   Lost manual corrections.
-   Double-clicking submit.
-   Editing locked attendance.
-   Unauthorized class selection.
-   Invalid class/subject combinations.

Frontend validation improves UX; backend validation remains
authoritative.

------------------------------------------------------------------------

# 34. Implementation Phases

The complete Teacher Portal should be implemented in the following
order.

## Phase 1 --- Teacher Shell

Implement:

-   Login integration.
-   Teacher route protection.
-   Desktop layout.
-   Mobile layout.
-   Sidebar.
-   Header.
-   Responsive navigation.
-   Dashboard.
-   Profile.
-   Logout.
-   Change password where backend support exists.

------------------------------------------------------------------------

## Phase 2 --- Academic Data

Implement:

-   My Classes.
-   My Subjects.
-   Student List.
-   Student Details.
-   Attendance Summary where supported.
-   Timetable if included in the existing project architecture.
-   API integration.
-   Loading states.
-   Empty states.
-   Error states.

------------------------------------------------------------------------

## Phase 3 --- Core Attendance

Implement:

-   Start Attendance.
-   Class selection.
-   Subject selection.
-   Session creation.
-   Camera workflow.
-   Multiple-face detection integration.
-   Face recognition.
-   Multi-frame confirmation where supported.
-   Unknown face handling.
-   Duplicate prevention.
-   Force Manual Attendance.
-   Manual Attendance.
-   Mark All Present.
-   Attendance Review.
-   Manual Corrections.
-   Submit Attendance.
-   Lock Attendance.

------------------------------------------------------------------------

## Phase 4 --- History, Reports and Corrections

Implement:

-   Attendance History.
-   Date-wise filtering.
-   Class-wise filtering.
-   Subject-wise filtering.
-   Session Details.
-   Class Attendance reports.
-   Subject Attendance reports.
-   Student-wise Attendance reports.
-   Date-wise reports.
-   Export where supported.
-   Correction Request workflow.
-   Locked-session correction UI.

------------------------------------------------------------------------

## Phase 5 --- Polish and QA

Verify:

-   Responsive behavior.
-   Camera permissions.
-   Camera failures.
-   Loading states.
-   Empty states.
-   Error states.
-   Unauthorized states.
-   Forbidden states.
-   Accessibility.
-   Navigation.
-   Form validation.
-   Duplicate submission prevention.
-   API error handling.
-   Locked attendance behavior.
-   Correction request behavior.
-   Browser console errors.
-   TypeScript/lint errors.
-   Production build.

------------------------------------------------------------------------

# 35. Development Rules

1.  Inspect before modifying when necessary.
2.  Reuse before creating.
3.  Do not invent APIs.
4.  Do not invent database fields.
5.  Do not invent response formats.
6.  Do not hardcode production data.
7.  Do not fake successful API responses.
8.  Follow existing naming conventions.
9.  Follow existing coding conventions.
10. Keep authentication centralized.
11. Keep authorization enforced by the backend.
12. Do not expose biometric data.
13. Do not modify unrelated modules unnecessarily.
14. Avoid large refactors unless required.
15. Test meaningful changes.
16. Fix errors introduced by the implementation.
17. Do not mark unsupported backend functionality as complete.
18. Document blockers clearly.
19. Teacher cannot directly edit locked attendance.
20. Teacher cannot approve correction requests.
21. Teacher cannot delete students.
22. Teacher cannot manage face data.
23. Teacher cannot add/remove teachers.

------------------------------------------------------------------------

# 36. Acceptance Criteria

The Teacher Portal is functionally complete when:

-   [ ] Teacher login works with the existing authentication system.
-   [ ] Forgot password/OTP works where backend support exists.
-   [ ] Teacher routes are protected.
-   [ ] Dashboard works with real data.
-   [ ] Assigned classes are displayed.
-   [ ] Assigned subjects are displayed.
-   [ ] Student List works.
-   [ ] Student Details work where supported.
-   [ ] Timetable works where supported.
-   [ ] Attendance session can be started.
-   [ ] Face recognition workflow works where recognition backend
    support exists.
-   [ ] Multiple faces can be handled where supported.
-   [ ] Multi-frame confirmation works where supported.
-   [ ] Unknown faces are handled safely.
-   [ ] Duplicate attendance is prevented.
-   [ ] Force Manual Attendance works.
-   [ ] Manual Present/Absent works.
-   [ ] Mark All Present works.
-   [ ] Attendance Review works.
-   [ ] Manual corrections work before submission.
-   [ ] Attendance can be submitted.
-   [ ] Submitted attendance becomes locked.
-   [ ] Teacher cannot directly edit locked attendance.
-   [ ] Correction Request works where backend support exists.
-   [ ] Attendance History works.
-   [ ] Attendance Reports work where backend support exists.
-   [ ] Export works where backend support exists.
-   [ ] Profile works.
-   [ ] Change Password works where backend support exists.
-   [ ] Logout works.
-   [ ] Teacher cannot access unauthorized data.
-   [ ] Loading states exist.
-   [ ] Empty states exist.
-   [ ] Error states exist.
-   [ ] Unauthorized/forbidden states are handled.
-   [ ] Mobile layout works.
-   [ ] Camera workflow works on supported mobile/tablet browsers.
-   [ ] Sensitive biometric data is not exposed.
-   [ ] No fake production data remains.
-   [ ] Production build succeeds.

------------------------------------------------------------------------

# 37. Definition of Done

A Teacher Portal feature is not complete merely because its UI exists.

A feature is complete when the supported flow is correctly connected:

``` text
UI
 ↓
Frontend State
 ↓
API Service
 ↓
Actual Backend Contract
 ↓
Backend Business Logic
 ↓
PostgreSQL
```

If the backend does not yet support a feature, clearly identify the
dependency rather than pretending the feature is functional.

------------------------------------------------------------------------

# 38. Final Coding-Agent Instruction

Read this entire file before implementing the Teacher Portal.

Treat this document as the authoritative Teacher Portal specification.

Implement the complete Teacher Portal through all five phases.

Use the existing FRAS V2 architecture, frontend, backend, database, API
contracts, project documentation, and PLAN as the source of truth.

Do not invent functionality, APIs, database fields, or fake data.

Do not break existing Admin or other portal functionality.

Complete the implementation from authentication through attendance,
reporting, correction requests, profile, responsive behavior, and QA.

At the end, report:

1.  What was implemented.
2.  Files/components changed.
3.  Backend APIs used.
4.  Backend dependencies or blockers.
5.  Remaining issues.
6.  Build/test status.

The objective is a real, maintainable, integrated Teacher Portal --- not
a visual mockup.
