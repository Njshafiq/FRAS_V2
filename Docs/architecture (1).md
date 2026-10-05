# FRAS V2 — Master Architecture

**Role:** System structure, ownership and boundaries.  
**Authority:** Defines components and communication.  
**Rule:** `AS-BUILT` describes current source; `TARGET` describes the approved destination.

## 1. Target Architecture
```text
+-----------------------------+
| React: Admin/Teacher/Student|
+-------------+---------------+
              | REST + JWT
              v
+--------------------------------------+
| Spring Boot                          |
| Auth/RBAC | Academic | Attendance   |
| Face orchestration | Audit/Security  |
+-----------+------------------+-------+
            | SQL/JPA          | authenticated AI API
            v                  v
       PostgreSQL        Python AI Service
                              |
                 OpenCV / MediaPipe
                 DeepFace / FaceNet512
```

## 2. Ownership
| Concern | React | Spring | Python | PostgreSQL |
|---|---|---|---|---|
| UI | Authority | | | |
| Authentication | | Authority | | data |
| Authorization | display only | Authority | service boundary | constraints |
| Academic data | | Authority | | Source of truth |
| Attendance rules/write | | Authority | Never | Persist |
| Face capture | Authority | | | |
| Face processing | | orchestrates | Authority | |
| Liveness/anti-spoof | | orchestrates | Authority | |
| Embedding generation | | | Authority | template persistence |

## 3. AS-BUILT Status
Frontend: `IMPLEMENTED/PARTIAL`. Spring: `IMPLEMENTED/PARTIAL`. PostgreSQL: `IMPLEMENTED/PARTIAL`. Python: `MISSING`.

Repository has native `getUserMedia`, centralized API fetching, JWT handling, academic/attendance/face-data APIs and Spring recognition DTOs/services. It does not contain Python source, manifests, model implementation, liveness, anti-spoof or service authentication.

## 4. Frontend Boundary
Target:
```text
Pages → feature components → API services → central fetch client → Spring
```
Camera captures evidence only. It does not authorize attendance and must not create fake embeddings.

Current conflict: legacy `faceService.ts` calls `/api/face/recognize` with image data, but no matching Spring controller exists. This is `LEGACY/CONFLICT` and should be retired after the unified flow is verified.

## 5. Spring Boundary
Target layers:
```text
Controller → Service → Repository / integration adapter → PostgreSQL / Python
```
Spring owns authentication, authorization, academic validation, session lifecycle, duplicate prevention, biometric-result validation and attendance persistence.

## 6. Python Boundary
Target:
```text
HTTP API → validation → image decode → detection → quality → alignment → liveness/anti-spoof → FaceNet512 → template comparison → multi-frame aggregation → result
```
Python must not maintain a competing attendance/student database. Runtime cache/index is an optimization, not a source of truth.

## 7. Enrollment Architecture
```text
Student → Front/Left/Right → quality → FaceNet512 → multiple templates → metadata → cache/index refresh
```
Current enrollment is invalid because the UI creates random vectors. Real enrollment is `MISSING`.

## 8. Recognition Architecture
```text
Live image/frame
 → decode
 → detect
 → quality
 → align
 → liveness/anti-spoof
 → embedding
 → compare templates
 → aggregate frames
 → threshold
 → Python result
 → Spring validation
 → attendance
```

## 9. Current API Conflict
Legacy:
```text
React → /api/face/recognize → imageData
```
No matching controller.

Newer Spring generation:
```text
/api/teacher/attendance-recognition
/api/teacher/attendance-recognition/multi-frame
```
DTOs currently expect embedding-oriented data. Python is absent. The final architecture must use one image/frame→Python contract.

## 10. Spring ↔ Python
Python is internal, not browser-facing. Production requires service authentication, payload limits, validation, timeout, rate/concurrency controls, safe errors and secure transport where appropriate.

## 11. Attendance Authority
Python: "Biometric evidence indicates STU001."  
Spring: validates session, teacher assignment, class/student eligibility, duplicate state and persistence policy.

## 12. Database Architecture
Conceptual:
```text
AcademicYear → Department → ClassEntity → Student
Teacher → TeacherClassAssignment → ClassEntity
Teacher → TeacherSubjectAssignment → Subject
AttendanceSession → AttendanceRecord
Student → FaceData → FaceSample/templates
```
Exact live schema remains unverified by the static audit.

Important current risk: JPA `ddl-auto=update` is active, SQL initialization is disabled, and `schema.sql` contains destructive DROP statements. A controlled migration strategy is required.

## 13. Authentication
```text
React → /api/auth/login → Spring → JWT → protected Spring APIs
Spring → authenticated internal request → Python
```
These are separate boundaries.

## 14. Performance
Known risks: camera requests around 2.5s, possible overlap, Base64 overhead, sequential remote calls, remote AI work inside transactions, linear face-template lookup, query amplification, missing circuit breaker/retry strategy and unclear payload limits. Optimize only after measurement.

## 15. Legacy to Retire
`/api/face/*`, unmatched `/api/attendance/*`, duplicate portal/service trees, LBPH terminology, random-vector enrollment, simulated recognition/fallbacks and unmatched auth methods should be explicitly retired or replaced.

## 16. Deployment Target
Development target: frontend + Spring `8081` + Python `8000` + PostgreSQL. Normalize the frontend `.env.example` mismatch found by audit (8080 vs 8081). Production requires environment-managed secrets, explicit CORS, internal Python access, TLS as required, backups and monitoring.

## 17. Open Architecture Decisions
Final Python API schema, embedding storage format, distance metric, threshold, liveness challenge, anti-spoof implementation, retention policy and deployment topology remain `OPEN` until decided/tested.
