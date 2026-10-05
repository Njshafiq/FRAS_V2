# FRAS V2 — Master Product Requirements Document

**Role:** Product requirements / product truth  
**Authority:** Defines what FRAS V2 is intended to accomplish.  
**Status labels:** `IMPLEMENTED`, `PARTIAL`, `PLANNED`, `MISSING`, `CONFLICT`, `LEGACY`, `OPEN`.

> Requirements are not proof of implementation. Current status must be supported by source/runtime/test evidence.

## 1. Product Overview
FRAS V2 is a role-based college attendance platform combining React + Vite + TypeScript, Java Spring Boot, PostgreSQL, and a dedicated Python biometric AI service using OpenCV, DeepFace and FaceNet512, with MediaPipe where required.

Target boundary:
```text
React → Spring Boot → PostgreSQL
                  ↘ authenticated Python AI
```
The browser must not directly call Python.

Current source baseline: React `IMPLEMENTED`; Spring `IMPLEMENTED`; PostgreSQL `IMPLEMENTED/PARTIAL`; Python AI `MISSING`; real FaceNet512 inference `MISSING`; real end-to-end biometric attendance `MISSING/CONFLICT`; Spring multi-frame voting `IMPLEMENTED` but not connected to real image inference.

## 2. Problem and Vision
Traditional attendance can be manual, slow, vulnerable to proxy attendance, and disconnected from academic structure. FRAS V2 aims to provide structured attendance with biometric verification while keeping authorization and persistence in Spring.

The product should provide:
1. Central academic management.
2. Authorized teacher attendance sessions.
3. Individual student attendance visibility.
4. Multi-template face enrollment.
5. Quality-aware, multi-frame recognition.
6. Layered liveness and anti-spoofing.
7. Spring as final attendance authority.
8. PostgreSQL as persistent source of truth.
9. Safe failure when AI is unavailable.
10. No fake biometric success in production.

## 3. Users
### Admin
Academic years, departments, classes, subjects, teachers, students, assignments, timetable, imports, face-data administration and sensitive operations.

### Teacher
Assigned classes/subjects, timetable context, attendance sessions, biometric attendance, permitted manual operations, review/history.

### Student
Individual login, own overall/subject/monthly/semester attendance and history.

## 4. Scope
### In scope
Authentication, RBAC, Admin/Teacher/Student portals, academic management, assignments, timetable, attendance sessions/records/history, face enrollment, recognition, multi-frame recognition, quality, liveness, anti-spoofing, threshold calibration, PostgreSQL, CSV/XLSX import, OTP-protected sensitive face-data deletion, audit/security and performance hardening.

### Out of scope unless approved
Browser→Python calls, Python attendance writes, automatic threshold weakening, uncontrolled raw-image storage, fake/random embeddings, one-frame authoritative attendance, duplicate competing biometric APIs, duplicate permanent analysis documents.

## 5. Core Requirements
### Authentication
Users authenticate through Spring. Known endpoint: `POST /api/auth/login`. Roles: `ADMIN`, `TEACHER`, `STUDENT`. Login is source-backed; complete account lifecycle, refresh/revocation and production secret enforcement remain `PARTIAL/MISSING`.

### Authorization
Server-side authorization is mandatory. Teacher access must be constrained by assignment/class/subject/session ownership. Student access is limited to the authenticated student's data. Current object-level authorization is `PARTIAL`.

### Academic structure
```text
Academic Year → Department → Class → Student
```
Teachers, subjects, assignments and timetable connect to this structure.

### Attendance
```text
Class → Subject/Session → Start → Verify → Review → Stop/Lock
```
Attendance records identify student, session, status, marking source and audit/timestamp data. Duplicate attendance must be prevented.

Manual attendance may exist only under an explicit policy. It must never be represented as biometric recognition. The current camera-to-manual fallback is a `CONFLICT` that must be resolved.

## 6. Face Enrollment
Target:
```text
Student → Front/Left/Right → multiple good frames → quality filtering → FaceNet512 → multiple templates
```
Enrollment must use real images, reject poor samples, record model/version, support controlled update/delete, and refresh/invalidate runtime recognition state. Current random-vector enrollment is invalid: `CONFLICT/MISSING`.

## 7. Face Recognition
Target pipeline:
```text
Camera frame → decode → face detection → quality → alignment → liveness/anti-spoof → FaceNet512 → template comparison → multi-frame aggregation → calibrated threshold → Spring validation → attendance
```
Python supplies biometric evidence; Spring decides whether attendance may be persisted.

## 8. Multi-Frame / Quality
Multiple frames provide temporal evidence. One poor frame cannot independently authorize attendance. Quality should consider no face, multiple faces, size, blur, lighting, pose and occlusion. Exact frame count/quorum/threshold are `OPEN` until tested.

## 9. Liveness / Anti-Spoof
Liveness is separate from identity. Blink alone is insufficient. Anti-spoofing must be tested against photo, screen and replay attacks. Current status: `MISSING`.

## 10. FaceNet512 / Threshold
FaceNet512 is the selected identity engine through DeepFace. The running implementation must verify dimension, preprocessing, normalization, metric, model version and threshold. Thresholds must be calibrated from genuine/impostor data and must not automatically drift. Current status: `MISSING`.

## 11. Python AI Service
Python owns image decoding, detection, quality, alignment, liveness, anti-spoofing, FaceNet512 inference, template comparison and biometric evidence. It does not own authentication, academic data, attendance authority or attendance persistence. Current status: `MISSING`.

## 12. Target AI Result
```json
{
  "matched": true,
  "studentId": "STU001",
  "distance": 0.16,
  "confidence": 94.7,
  "qualityScore": 0.91,
  "livenessScore": 0.96,
  "antiSpoof": true,
  "framesVerified": 5,
  "model": "FaceNet512",
  "modelVersion": "controlled-version"
}
```
This is a target concept, not a claim that the exact DTO is implemented.

## 13. Image / Privacy / Performance
Image data is not embedding data. Current browser capture uses in-memory camera frames and Base64 data URLs. Final transport is `OPEN`; choose from measured performance/security. Avoid unnecessary raw-image persistence and logging. Measure capture, encoding, transport, Python inference, DB and template lookup. Current audit identified possible overlapping camera requests, Base64 overhead, sequential remote calls and linear template lookup.

## 14. Error Requirements
Handle camera denied/unavailable, malformed frame, no face, multiple faces, low quality, liveness failure, anti-spoof failure, unknown face, insufficient evidence, AI timeout/unavailable, closed session, unauthorized class, duplicate attendance and processing errors. No failure may silently become success.

## 15. Current Critical Gaps
1. Camera recognition uses missing legacy `/api/face/recognize`.
2. Enrollment creates random vectors instead of real embeddings.
3. Teacher object-level authorization is incomplete.
4. Manual attendance can bypass biometric proof unless policy is resolved.
5. JWT has a known development fallback secret.
6. Biometric payload/privacy controls are incomplete.
7. Multiple stale API generations coexist.
8. Schema evolution is not migration-controlled.
9. Frontend automated tests are absent.
10. Python AI service and real biometric pipeline are absent.

## 16. Acceptance Criteria
Biometric release requires real camera→Python processing, real multi-angle templates, quality filtering, liveness/anti-spoof policy, multi-frame evidence, calibrated threshold, Spring session/authorization/duplicate validation, safe AI failure, removal of fake biometric paths, and passing end-to-end tests.

## 17. Open Decisions
Exact enrollment/recognition frame counts, quorum, metric, threshold, confidence conversion, liveness challenge, anti-spoof implementation, retention period, deployment topology, manual/bulk override policy and final image transport remain `OPEN` until explicitly decided and tested.
