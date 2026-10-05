# ADMIN_PLAN.md
# FRAS V2 — Admin Portal Master Plan

## 1. Purpose

The Admin Portal is the central management area for FRAS V2.

The Admin Portal manages:
- Students
- Teachers
- Academic structure
- Timetable
- Face/biometric enrollment and management
- Admin account and security
- Security-sensitive operations
- Audit information

The existing Admin Portal design should be preserved unless a requirement below explicitly changes it.

---

# 2. Admin Portal Structure

```text
ADMIN
│
├── Dashboard
│
├── Students
│   ├── Add Student
│   ├── Import Students
│   │   ├── CSV
│   │   ├── Excel (.xlsx)
│   │   ├── Template Download
│   │   ├── Data Validation
│   │   ├── Duplicate Detection
│   │   └── Import Preview
│   ├── Student Listing
│   ├── Student Details
│   ├── Edit Student
│   ├── Deactivate Student
│   └── Reactivate Student
│
├── Teachers
│   ├── Add Teacher
│   ├── Import Teachers
│   │   ├── CSV
│   │   ├── Excel (.xlsx)
│   │   ├── Template Download
│   │   ├── Data Validation
│   │   ├── Duplicate Detection
│   │   └── Import Preview
│   ├── Teacher Listing
│   ├── Teacher Details
│   ├── Edit Teacher
│   ├── Deactivate Teacher
│   └── Reactivate Teacher
│
├── Academics
│   ├── Academic Years
│   ├── Departments
│   ├── Classes / Sections
│   ├── Subjects
│   ├── Curriculum
│   └── Bulk Academic Setup
│
├── Timetable
│
├── Face Data Management
│
└── Profile / Security
```

---

# 3. Student Management

## 3.1 Add Student

Admin can manually create a student.

The existing student data model and authentication relationship must be reused where possible.

## 3.2 Import Students

Support:
- CSV upload
- Excel (.xlsx) upload
- Downloadable import template
- Validation before insertion
- Duplicate detection
- Preview before confirmation
- Import result/error report

Import flow:

```text
Upload
  ↓
Parse
  ↓
Validate
  ↓
Detect duplicates/errors
  ↓
Preview
  ↓
Admin confirms
  ↓
Backend saves
  ↓
Import result
```

## 3.3 Student Listing

Provide:
- Search
- Filtering
- Active/Inactive status
- Student details
- Edit
- Deactivate
- Reactivate where applicable

## 3.4 Student Deactivation

Normal student removal must be a SOFT DEACTIVATION.

Do NOT physically delete the student record during normal Admin operations.

Flow:

```text
Admin
  ↓
Select Student
  ↓
Deactivate Student
  ↓
Confirmation
  ↓
Security Verification
  ↓
Student → INACTIVE
```

After deactivation:
- Student login is disabled.
- Student cannot participate in new attendance.
- Student should not be available for new attendance recognition.
- Historical attendance remains preserved.
- Historical academic information remains preserved.
- The action is audit logged.

## 3.5 Student Reactivation

Admin can reactivate an inactive student.

```text
INACTIVE → ACTIVE
```

After reactivation:
- Student login can be restored.
- Student can participate in future attendance.
- Historical attendance remains unchanged.

---

# 4. Teacher Management

## 4.1 Add Teacher

Admin can manually create a teacher.

## 4.2 Import Teachers

Support:
- CSV
- Excel (.xlsx)
- Downloadable template
- Data validation
- Duplicate detection
- Import preview
- Admin confirmation
- Import result/error report

## 4.3 Teacher Listing

Provide:
- Search
- Filtering
- Active/Inactive status
- Teacher details
- Edit
- Deactivate
- Reactivate

## 4.4 Teacher-Class Assignments

Admin can:
- Select Teacher
- Select Academic Year
- Select Department
- Select Class / Section
- Assign

## 4.5 Teacher-Subject Assignments

Admin can:
- Select Teacher
- Select Subject
- Select Class / Section
- Assign

## 4.6 Teacher Deactivation

Normal teacher removal must be a SOFT DEACTIVATION.

After deactivation:
- Teacher login is disabled.
- Teacher cannot start new attendance sessions.
- Teacher cannot perform new authorized teaching operations.
- Historical attendance remains preserved.
- Historical teaching/subject/class associations remain preserved where required.
- The action is audit logged.

## 4.7 Teacher Reactivation

Admin can reactivate an inactive teacher.

```text
INACTIVE → ACTIVE
```

Historical attendance and historical associations remain unchanged.

---

# 5. Academic Management

## 5.1 Academic Years

Admin can:
- Add Academic Year
- View Academic Years
- Set Active Academic Year
- Manage existing academic years

Only the appropriate active academic year should be used for new academic operations.

## 5.2 Departments

Admin can:
- Add Department
- Edit Department
- View departments
- Manage departments
- Import departments using CSV
- Import departments using Excel

## 5.3 Classes / Sections

Admin can:
- Add Class
- Add Section
- Edit Class
- Edit Section
- View/manage classes and sections
- Import classes/sections using CSV
- Import classes/sections using Excel

Relationships must be validated.

Example:

```text
Department
    ↓
Class
    ↓
Section
```

## 5.4 Subjects

Admin can:
- Add Subject
- Edit Subject
- View subjects
- Manage subjects
- Import subjects using CSV
- Import subjects using Excel

Subject information may include:
- Subject Code
- Subject Name
- Department
- Semester
- Other fields already supported by the existing model

Subject code uniqueness must be validated according to the existing database rules.

## 5.5 Curriculum

Curriculum is a separate academic concept from the subject master list.

Admin can:
- Create curriculum records
- Edit curriculum
- View/manage curriculum
- Import curriculum using CSV
- Import curriculum using Excel

Curriculum may associate:
- Regulation
- Department / Program
- Semester
- Subject
- Credits
- Course Type
- Academic Year where applicable

Example:

```text
B.E. CSE
Regulation: 2021
Semester: 5

Subject → DBMS
Credits → 4
```

The exact fields must follow the existing backend/domain model.

---

# 6. Bulk Academic Setup

Individual imports MUST NOT be removed.

Both individual imports and combined academic import must exist.

## 6.1 Individual Imports

Each academic entity has its own import:

```text
Departments
  └── Import CSV / Excel

Classes / Sections
  └── Import CSV / Excel

Subjects
  └── Import CSV / Excel

Curriculum
  └── Import CSV / Excel
```

This is useful when only one entity needs to be added or updated.

## 6.2 Combined Academic Import

Provide an additional:

```text
Academics
  └── Bulk Academic Setup
```

The preferred combined format is one Excel workbook with multiple sheets:

```text
Academic_Data.xlsx
│
├── Departments
├── Classes_Sections
├── Subjects
└── Curriculum
```

The backend must process dependencies in the correct order:

```text
Departments
    ↓
Classes / Sections
    ↓
Subjects
    ↓
Curriculum
```

The combined import must validate relationships before committing data.

If a required dependency does not exist, the import must report the error rather than creating inconsistent records.

CSV remains available for individual entity imports because a CSV file represents one table/entity at a time.

---

# 7. Import Validation

All CSV/Excel imports must follow:

```text
Upload
  ↓
Parse
  ↓
Validate columns
  ↓
Validate required fields
  ↓
Validate relationships
  ↓
Check duplicates
  ↓
Preview
  ↓
Admin confirmation
  ↓
Database transaction
  ↓
Import result
```

The system should report:
- Total rows
- Successfully processed rows
- Failed rows
- Row numbers
- Validation errors
- Duplicate records

Example:

```text
Import completed

Total rows: 120
Successful: 114
Failed: 6

Row 17  → Duplicate Teacher ID
Row 43  → Invalid Department
Row 81  → Missing required field
```

The backend, not only the frontend, must perform validation.

---

# 8. Timetable

The Admin Portal contains Timetable management.

The existing timetable design and backend model must be inspected before implementation.

Timetable operations must respect:
- Academic year
- Department
- Class / Section
- Subject
- Teacher
- Applicable schedule information

Do not create duplicate timetable models if one already exists in the project.

---

# 9. Face Data Management — V2

Face Data Management is an Admin-only feature.

## 9.1 V2 Enrollment

V2 MUST use LIVE CAMERA FACE ENROLLMENT.

Normal photo-upload enrollment is NOT the primary V2 enrollment workflow.

Flow:

```text
Admin
  ↓
Face Data Management
  ↓
Select Student
  ↓
Start Enrollment
  ↓
Live Camera
  ↓
Face Detection
  ↓
Face Quality / Position Check
  ↓
Capture Multiple Frames
  ↓
Generate FaceNet512 Embedding
  ↓
1:N Duplicate Face Check
  ↓
Save Biometric Data
```

## 9.2 Enrollment UI

The frontend should provide:
- Student information
- Enrollment status
- Live camera preview
- Face detection status
- Face quality/position status
- Capture progress
- Processing state
- Success state
- Duplicate/rejection state
- Retry option

Do NOT display "128-dimensional embedding" if FaceNet512 is being used.

Use wording consistent with the actual model, such as:

```text
FaceNet512 embedding
```

## 9.3 Duplicate Face Protection

Before saving a new face embedding:

```text
New Face
  ↓
Generate Embedding
  ↓
Compare against existing enrolled faces
  ↓
1:N duplicate check
```

If the face is already associated with another enrolled record:

```text
Enrollment rejected.

This face is already registered.
Please contact the administrator.
```

Do NOT reveal the identity of the matched student to the user.

## 9.4 Re-enrollment

Re-enrollment must also use live camera capture.

Flow:

```text
Select Student
  ↓
Live Camera
  ↓
Capture
  ↓
FaceNet512
  ↓
1:N Duplicate Check
  ↓
Replace/update biometric record
```

## 9.5 Delete Face Data

Deleting face data is separate from deactivating a student.

Deleting face data must NOT delete:
- Student record
- Attendance history
- Academic records

Delete face data is a security-sensitive Admin operation.

## 9.6 V3 Boundary

Teacher-supervised face enrollment is a V3 feature.

Do NOT modify the existing Teacher Portal to implement teacher-supervised enrollment in V2.

---

# 10. Student / Teacher / Biometric Lifecycle Separation

These are separate concepts:

```text
Student Account
      │
      ├── Academic Data
      │
      ├── Attendance History
      │
      └── Biometric Data
```

Deactivating a student does not mean deleting all related data.

Normal deactivation:
- Account becomes inactive
- New access is disabled
- New attendance recognition is disabled
- Historical records remain

Biometric deletion:
- Face data is removed
- Student record remains
- Attendance history remains
- Academic records remain

---

# 11. Historical Attendance Protection

Historical attendance must NOT be deleted when a student or teacher is deactivated.

Historical attendance may be required for:
- Subject-wise attendance
- Monthly attendance
- Semester attendance
- Student reports
- Admin reports
- Audit/history

The database must be reviewed to ensure that deactivation cannot trigger unintended cascade deletion.

Foreign-key relationships and cascade settings must be inspected before implementation.

---

# 12. Admin Profile

The Admin profile should contain:

```text
Full Name
Username
Role
Email Address
Mobile Number
Email Verification Status
Mobile Verification Status
```

It should also support:
- Change security password
- Security contact management
- Appropriate verification of security contacts

At least one verified Admin security channel should be configured before OTP-protected operations are enabled.

---

# 13. Admin Security Verification

For sensitive Admin actions, V2 supports BOTH:

1. Admin password verification
2. OTP verification

Password is the primary convenient verification method for normal sensitive operations.

OTP is an alternative verification method.

The most critical permanent operations may require BOTH password and OTP.

## 13.1 Normal Sensitive Operations

Examples:
- Deactivate Student
- Deactivate Teacher
- Delete Face Data

Possible flow:

```text
Admin
  ↓
Sensitive Action
  ↓
Confirmation
  ↓
Choose Verification
  ├── Admin Password
  └── OTP
  ↓
Verification successful
  ↓
Execute action
```

## 13.2 Highly Critical Operations

For permanent/high-risk operations:

```text
Admin Password
      ↓
OTP
      ↓
Final Confirmation
      ↓
Execute
```

The exact list of operations requiring both must be determined by the backend security policy.

---

# 14. OTP Rules

OTP must be associated with:
- Authenticated Admin
- Intended operation
- Appropriate target/resource
- Expiration time

OTP must be:
- Short-lived
- Single-use
- Invalidated after successful verification
- Rate-limited
- Securely stored/handled

The backend must perform OTP validation.

The frontend must never be trusted as proof of successful OTP verification.

OTP should be delivered to the Admin's verified security contact.

It must NOT be sent to the student/teacher being deactivated.

Do NOT implement fake SMS delivery.

Preferred V2 OTP channel:
- Verified Admin email

SMS can be added later when an actual SMS provider is configured.

---

# 15. Backend Requirements

Before changing backend code, inspect the existing project.

Review:
- Entities
- Repositories
- Services
- Controllers
- DTOs
- Security configuration
- PostgreSQL schema
- Migrations
- Attendance relationships
- Face-data relationships
- Existing OTP/authentication implementation

Reuse the existing architecture and conventions.

Do not rewrite unrelated modules.

## Required backend capabilities

### Student
- Active/inactive lifecycle
- Deactivate
- Reactivate
- Existing student CRUD
- Import support

### Teacher
- Active/inactive lifecycle
- Deactivate
- Reactivate
- Existing teacher CRUD
- Import support

### Academics
- Academic year management
- Department CRUD/import
- Class/section CRUD/import
- Subject CRUD/import
- Curriculum CRUD/import
- Combined academic import

### Face
- Live enrollment
- FaceNet512 embedding
- 1:N duplicate check
- Re-enrollment
- Disable face recognition
- Delete face data

### Admin Security
- Admin profile
- Security contact
- Password verification
- OTP request
- OTP verification
- Authorization
- Audit logging

---

# 16. API Requirements

Before creating endpoints, inspect existing API conventions and reuse equivalent endpoints where possible.

Potential capabilities:

## Student APIs
- List active students
- List inactive students
- Get student details
- Create student
- Update student
- Deactivate student
- Reactivate student
- Import students

## Teacher APIs
- List active teachers
- List inactive teachers
- Get teacher details
- Create teacher
- Update teacher
- Deactivate teacher
- Reactivate teacher
- Import teachers
- Teacher-class assignment
- Teacher-subject assignment

## Academic APIs
- Academic year CRUD
- Department CRUD
- Department import
- Class/section CRUD
- Class/section import
- Subject CRUD
- Subject import
- Curriculum CRUD
- Curriculum import
- Combined academic import

## Face APIs
- Get enrollment status
- Start live enrollment
- Submit/process captured enrollment
- Re-enroll
- Disable face recognition
- Delete face data

## Admin Security APIs
- Get Admin profile
- Update Admin profile/security contact
- Request OTP
- Verify OTP
- Password verification where required

All Admin-only endpoints must enforce authorization server-side.

---

# 17. API Security

Do not trust frontend authorization.

Backend must verify:
- Authenticated user
- ADMIN role for Admin-only operations
- Ownership/target relationship where applicable
- Valid security verification
- Valid OTP
- Valid operation context

Never trust:
- Role supplied by frontend
- Arbitrary studentId
- Arbitrary teacherId
- Frontend-only OTP state
- Frontend-only permission checks

Raw face embeddings must not be exposed unnecessarily through APIs.

---

# 18. PostgreSQL / Database Requirements

Before changing the schema, inspect the current PostgreSQL model.

Review:
- Student table/entity
- Teacher table/entity
- Attendance table/entity
- Academic tables/entities
- Curriculum relationships
- Face/biometric table/entity
- User/authentication tables
- Admin/security data
- Foreign keys
- Cascade rules

Student and teacher deactivation should use an active/inactive lifecycle.

Historical attendance must not be physically removed because of normal deactivation.

Biometric data must have an independent lifecycle.

Use the existing database migration strategy.

---

# 19. Audit Logging

Security-sensitive Admin actions should be recorded.

At minimum:
- Student deactivation
- Student reactivation
- Teacher deactivation
- Teacher reactivation
- Face enrollment
- Face re-enrollment
- Face-data deletion
- Face-recognition disablement
- Admin security-contact changes
- Other security-sensitive operations

Audit information should include appropriate:
- Actor/Admin
- Action
- Target entity
- Timestamp
- Result/status

Do NOT store raw face images or raw biometric embeddings in the audit log.

---

# 20. Frontend Requirements

Modify the existing Admin Portal rather than rebuilding it.

## Students
- Add
- Import CSV/Excel
- Listing
- Details
- Edit
- Deactivate
- Reactivate
- Status indicators
- Confirmation
- Password/OTP security verification

## Teachers
- Add
- Import CSV/Excel
- Listing
- Details
- Edit
- Assignments
- Deactivate
- Reactivate
- Status indicators
- Confirmation
- Password/OTP security verification

## Academics
- Academic years
- Departments
- Classes/sections
- Subjects
- Curriculum
- Individual CSV/Excel imports
- Combined Excel academic setup
- Validation and preview

## Face Data
- Live camera enrollment
- Face status
- FaceNet512 processing state
- Duplicate detection result
- Re-enrollment
- Delete/disable controls
- No normal photo-upload enrollment

## Admin Profile
- Full name
- Username
- Role
- Email
- Mobile
- Verification status
- Password/security settings

---

# 21. UI/UX Rules for Imports

All import pages should support:

```text
Download Template
       ↓
Upload File
       ↓
Validate
       ↓
Preview
       ↓
Confirm Import
       ↓
Result
```

Do not silently insert invalid rows.

Provide clear validation errors with row information.

---

# 22. V2 / V3 Boundary

## V2

V2 includes:
- Admin Portal
- Student management
- Teacher management
- Academic management
- Individual imports
- Combined academic Excel import
- Timetable management
- Admin security
- Password verification
- OTP verification
- Soft deactivation
- Historical attendance preservation
- Admin-controlled live-camera face enrollment
- FaceNet512
- 1:N duplicate-face detection
- Face-data management

## V3

V3 includes:
- Teacher-supervised face enrollment

Do not implement V3 teacher-supervised enrollment in the current V2 build.

---

# 23. Implementation Rules for Antigravity

Before modifying code:

1. Read this ADMIN_PLAN.md completely.
2. Inspect the existing frontend and backend.
3. Identify existing implementations before creating new ones.
4. Reuse existing components, services, APIs, entities, repositories, and authentication wherever possible.
5. Do not create duplicate functionality.
6. Do not redesign unrelated pages.
7. Do not modify the existing Teacher Portal for V3 functionality.
8. Do not remove individual academic imports when adding combined import.
9. Do not implement photo-upload enrollment as the normal V2 face enrollment flow.
10. Do not physically delete students/teachers during normal deactivation.
11. Do not allow deactivation to delete historical attendance.
12. Do not trust frontend-only authorization or OTP validation.
13. Use PostgreSQL migrations according to the existing project.
14. Test backend APIs and frontend flows after implementation.

After implementation, report:

- Files changed
- Database/schema changes
- Migration changes
- Entity changes
- Repository/service changes
- API endpoints added/modified
- Authentication/authorization changes
- OTP/password verification changes
- Frontend changes
- Face enrollment changes
- Import changes
- Tests performed
- Remaining limitations
