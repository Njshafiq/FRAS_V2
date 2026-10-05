# FRAS V2 — Master Project Memory

**Role:** Durable decisions, history, constraints and important facts.  
**Not a substitute for:** PRD, architecture, plan, rules or design.

## 1. Project Identity
FRAS V2 — Face Recognition Attendance System V2. College attendance platform with role-based academic management and biometric attendance.

Stack: React, Vite, TypeScript, Spring Boot, Java 21, PostgreSQL, planned Python AI, OpenCV, MediaPipe, DeepFace, FaceNet512.

## 2. Document Authority
```text
PRD.md         = what/why
architecture.md = system structure/ownership
plan.md        = execution
rules.md       = non-negotiable constraints
design.md      = detailed behavior
memory.md      = decisions/history
```
No duplicate permanent source-of-truth documents.

## 3. Core Decisions
### DEC-001 — Spring owns attendance
Spring is the final attendance/business authority because attendance is an academic record requiring authorization, session validation and duplicate prevention. Python returns evidence only.

### DEC-002 — Python is a separate biometric service
Python is the biometric processing layer because the selected OpenCV/DeepFace/FaceNet512 ecosystem belongs there. Browser does not call Python directly.

### DEC-003 — PostgreSQL is persistent source of truth
Academic, attendance and approved biometric-template data are persisted through the application database. Runtime Python caches/indexes are not independent sources of truth.

### DEC-004 — FaceNet512 is identity engine
FaceNet512 is selected through DeepFace. Actual dimension, preprocessing, normalization, metric, version and threshold must be verified from the running implementation.

### DEC-005 — Multi-angle enrollment
Front/Left/Right with multiple good frames is the target because a single photograph is less robust to pose changes.

### DEC-006 — Multi-frame recognition
Recognition uses multiple evidence frames so one noisy frame cannot independently authorize attendance.

### DEC-007 — Liveness separate from identity
Liveness is a separate signal; blink/head movement alone is not complete anti-spoof proof.

### DEC-008 — Calibrated threshold
Production threshold must be selected from genuine/impostor data and must not automatically weaken or drift.

## 4. Current Source Baseline
The source audit was static: it did not run the application/build/tests/live APIs or verify the live PostgreSQL schema.

```text
React frontend              PRESENT
Spring backend              PRESENT
PostgreSQL integration      PRESENT
JWT/auth                    PRESENT/PARTIAL
Attendance APIs             PRESENT
Face-data APIs              PRESENT
Camera capture              PRESENT
Spring recognition DTOs     PRESENT
Spring AI adapter           PRESENT
Python AI                   ABSENT
Real FaceNet512 inference   ABSENT
Real enrollment             ABSENT/CONFLICT
Liveness                    ABSENT
Anti-spoof                  ABSENT
Threshold calibration       ABSENT
Frontend automated tests    ABSENT
```

## 5. Important Historical Problems
### HISTORY-001 — Legacy recognition
Frontend uses `/api/face/recognize` with image data; no matching Spring controller exists. Do not create a duplicate endpoint just to mask the mismatch.

### HISTORY-002 — Fake enrollment
Current admin face-data UI creates a random 512-number vector and labels it FaceNet512. It is not a real embedding and must not be treated as valid biometric enrollment.

### HISTORY-003 — Image/embedding mismatch
Browser has image/frame data while newer Spring DTOs expect `embeddingData`. Target solution is real image→embedding processing in Python.

### HISTORY-004 — Python absent
No Python service/model implementation exists in the repository. Strings/comments/labels mentioning DeepFace or FaceNet512 are not model execution.

### HISTORY-005 — Multiple API generations
Legacy `/api/face/*` and `/api/attendance/*` services coexist with newer `/api/admin/*`, `/api/teacher/*`, `/api/student/*` APIs. Target is one authoritative generation per capability.

### HISTORY-006 — Schema risk
JPA `ddl-auto=update` is active; SQL initialization is disabled; `schema.sql` contains destructive DROP statements. Controlled migrations are required.

## 6. Integration Facts
Current browser camera uses `navigator.mediaDevices.getUserMedia` and canvas-based JPEG/PNG Base64 data URLs. Final AI transport is not frozen.

Known development Spring port: `8081`. Planned Python port: `8000`.

Current Spring AI configuration is conceptually `AI_SERVICE_URL` and `AI_SERVICE_TIMEOUT_MS`; Java adapter assumes `/recognize`, but final contract is not implemented.

## 7. Biometric Mental Model
```text
Image ≠ Embedding ≠ Attendance

Image → biometric processing → embedding/evidence → Spring validation → attendance
```
Do not collapse these layers.

## 8. Python Phase Memory
Approved sequence:
```text
0 architecture freeze
1 Python foundation
2 multi-angle enrollment
3 basic recognition
4 Spring integration
5 liveness
6 anti-spoof
7 threshold calibration
8 robustness
9 performance
10 security
11 E2E testing
12 release
```
Do not jump to advanced anti-spoofing before the basic image→embedding→matching path works.

## 9. Open Decisions
Exact enrollment/recognition frame counts, quorum, metric, threshold, confidence conversion, liveness challenge, anti-spoof implementation, retention period, deployment topology, manual/bulk override policy and final image transport remain `OPEN` until explicitly decided and tested.

## 10. AI Agent Memory
1. Read all six master files before architecture-sensitive work.
2. Inspect source before claiming status.
3. Do not invent APIs.
4. Do not generate fake biometric data.
5. Do not create duplicate permanent documentation.
6. Do not bypass Spring attendance authority.
7. Do not let Python write attendance.
8. Do not change thresholds without calibration evidence.
9. Preserve approved boundaries.
10. Report uncertainty instead of guessing.

## 11. Change Record Rule
Update memory only for important decisions affecting system boundaries, data ownership, biometric methodology, attendance authority or deployment architecture. Normal bug fixes do not require a memory entry.
