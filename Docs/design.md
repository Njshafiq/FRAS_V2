# FRAS V2 — Master Functional & Technical Design

**Role:** Detailed feature behavior and implementation design.  
**Authority:** Defines how requirements should work; planned behavior is not claimed as current implementation.

## 1. Design Principles
Backend authority, evidence-based biometric decisions, explicit state machines, clear recovery, minimal biometric exposure, consistent contracts, responsive UI and safe failure.

## 2. Global Flow
```text
Login → Spring authentication → JWT → role → Admin / Teacher / Student portal
```

## 3. Authentication
```text
Login → POST /api/auth/login → Spring → JWT → protected routes/APIs
```
Failures: invalid credentials, invalid/expired token, unauthorized role, backend unavailable.

## 4. Authorization
Spring evaluates role plus object ownership/assignment. Teacher actions must be constrained by class, subject and session. Student data is scoped to the authenticated student.

## 5. Admin Flow
```text
Academic Year → Department → Class → Students
Subjects / Teachers / Assignments / Timetable / Face Data
```

## 6. Teacher Flow
```text
Dashboard → Assigned Class → Assigned Subject → Session → Start → Recognition → Review → Stop/Lock
```

## 7. Student Flow
```text
Login → Dashboard → Overall / Subject / Monthly / Semester / History
```

## 8. Attendance State Machine
```text
NOT_STARTED → ACTIVE → STOPPING → LOCKED
```
Spring rejects invalid transitions.

## 9. Camera State Machine
```text
IDLE → REQUEST_PERMISSION → CAMERA_READY → CAPTURING → PROCESSING → RESULT
```
Recovery: `CAMERA_PERMISSION_DENIED`, `CAMERA_UNAVAILABLE`.

## 10. Target Recognition State Machine
```text
CAPTURING
 ↓
FACE_DETECTION ── NO_FACE / MULTIPLE_FACES → CAPTURING
 ↓
QUALITY_CHECK ── LOW_QUALITY → CAPTURING
 ↓
LIVENESS / ANTI-SPOOF ── FAIL → REJECTED
 ↓
IDENTITY_MATCH ── UNKNOWN → REJECTED
 ↓
MULTI_FRAME ── INSUFFICIENT → CAPTURING
 ↓
SPRING_VALIDATION ── DUPLICATE / CLOSED / UNAUTHORIZED → REJECTED
 ↓
ATTENDANCE_MARKED
```

## 11. Enrollment
```text
Student → Front → valid frames → Left → valid frames → Right → valid frames → FaceNet512 → template validation → save → cache refresh
```
Rejected states: no face, multiple faces, too small, blurry, too dark, extreme pose, occlusion, wrong angle, processing error. Exact frame count is `OPEN`.

## 12. Recognition
```text
Browser image/frame
 → Spring
 → Python decode
 → detection
 → quality
 → alignment
 → liveness/anti-spoof
 → FaceNet512
 → template comparison
 → multi-frame aggregation
 → threshold
 → Python result
 → Spring session/authorization/duplicate checks
 → attendance
```

## 13. Spring/Python Contract
The repository's current contract is embedding-oriented and is not final. The target contract must carry image/frame evidence to Python because the browser produces images, not genuine embeddings.

Conceptual request:
```json
{"sessionId":123,"frames":[{"frameId":"f001","imageData":"data:image/jpeg;base64,..."}],"modelVersion":"controlled-version"}
```
Conceptual response:
```json
{"decision":"RECOGNIZED","studentId":"STU001","matched":true,"distance":0.16,"confidence":94.7,"qualityScore":0.91,"livenessScore":0.96,"antiSpoof":true,"framesVerified":5,"model":"FaceNet512","modelVersion":"controlled-version"}
```
These are design concepts, not current DTO claims.

Possible decisions: `RECOGNIZED`, `REJECTED`, `LOW_QUALITY`, `SPOOF_SUSPECTED`, `NO_FACE`, `MULTIPLE_FACES`, `INSUFFICIENT_EVIDENCE`, `PROCESSING_ERROR`.

## 14. Attendance Decision
Spring verifies result structure, student, class, teacher authorization, active session and duplicate state before persistence.

## 15. Multi-Frame
Each frame can yield quality/candidate/distance/liveness evidence. Results are grouped by candidate, checked for consistency and aggregated using an approved quorum. Exact quorum is `OPEN`.

## 16. Liveness
Potential pipeline: landmarks → temporal movement → supporting blink/pose signals → optional challenge → liveness decision. Challenge has timeout and is separate from identity. Blink alone is insufficient.

## 17. Anti-Spoof
Anti-spoof produces PASS/FAIL/UNAVAILABLE. If policy requires it and it fails/unavailable, no biometric attendance. User messages should not expose internal security implementation.

## 18. Templates
```text
Student → Face Profile → Front/Left/Right templates
                         + model/version/status/timestamps
```
Runtime cache/index may accelerate comparison; PostgreSQL remains authoritative.

## 19. Current API Conflict
`faceService.ts` → `/api/face/recognize` is unmatched. Target is one unified recognition API and removal of competing legacy paths after replacement verification.

## 20. Error Mapping
Example:
```text
Python timeout → Spring AI_TIMEOUT → frontend unavailable message → no biometric attendance
```
Never silently fall back to `PRESENT`.

## 21. Privacy
Normal users do not see raw biometric images, embeddings, credentials or internal AI errors. Raw frames remain in memory unless an approved requirement says otherwise.

## 22. Performance
Target bounded frame count, image/body limits, in-flight guard, timeout, cancellation/backpressure, model loaded once, controlled template cache, efficient DB access and short transactions. Measure before optimizing.

## 23. UI States
Common: `LOADING`, `POPULATED`, `EMPTY`, `ERROR`, `UNAUTHORIZED`. Recognition: scanning, face detected, poor quality, multiple faces, verifying, recognized, unknown, already marked, liveness required, spoof suspected, unavailable, processing error.

## 24. Accessibility / Responsive
Keyboard access, visible focus, readable status, non-color-only indicators, accessible labels. Camera workflows must account for viewport, orientation, permissions, latency and status readability.

## 25. Testing Design
Enrollment: good angles, poor quality, no/multiple face, duplicate. Recognition: genuine/impostor/unknown, pose, low light, blur, liveness/spoof, inconsistent frames. Attendance: valid/closed/duplicate/unauthorized/wrong class. Infrastructure: timeout/unavailable/malformed/DB/concurrency.

## 26. Current vs Target
| Area | Current | Target |
|---|---|---|
| Camera | Present | Keep |
| Browser image capture | Present | Keep |
| `/api/face/recognize` | Legacy/missing | Retire |
| Spring recognition | Embedding-oriented | Image/frame contract |
| Python | Missing | Dedicated AI service |
| Enrollment | Random vector | Real FaceNet512 templates |
| Multi-angle | Missing | Front/Left/Right |
| Quality | Missing | Required |
| Multi-frame voting | Present in backend | Connect to real evidence |
| Liveness | Missing | Layered |
| Anti-spoof | Missing | Tested |
| Threshold calibration | Missing | Required |
| Attendance authority | Spring | Keep |
| PostgreSQL | Present | Source of truth |
