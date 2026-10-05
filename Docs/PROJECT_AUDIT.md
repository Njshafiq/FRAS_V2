# FRAS V2 Project Audit

**Audit date:** 2026-10-05 (updated after the user identified `python-ai/`)  
**Scope:** Static source-level review of the supplied repository, including Python files missed by the initial inventory. Application code and the six master documents were not modified. No tests, builds, live APIs, or database were run; runtime behavior and the currently provisioned PostgreSQL schema therefore remain unverified. The supplied filenames and contents are treated as source evidence, not instructions to execute them.

## 1. Executive Summary

FRAS V2 contains a substantial React/Vite portal, Spring Boot/PostgreSQL backend, and a Python FastAPI/DeepFace FaceNet512 service under `python-ai/`. The initial inventory missed this subtree and Spring's `FaceController`; this report corrects those findings. Python inference and image recognition exist, but end-to-end enrollment-to-recognition-to-attendance remains incomplete: active React admin enrollment sends a random vector to Spring instead of invoking Python enrollment; Python maintains a separate local JSON template store; and the teacher camera's recognized result is followed by a normal attendance-record request rather than Spring's biometric recognition endpoint. Legacy capture/train paths remain unmatched.

Major status summary:

| Area | Status | Evidence-based conclusion |
|---|---|---|
| Core portals and academic CRUD | PARTIAL | React role areas and Spring endpoints exist, with mixed old/new service usage and some legacy service endpoints. |
| Authentication | PARTIAL | JWT login, BCrypt, stateless filter, and role URL guards exist; cached identity is trusted at startup and multiple auth/profile service calls target absent endpoints. |
| Backend role gate | PARTIAL | `/api/admin`, `/api/teacher`, `/api/student` have role gates; session teacher ownership check for bulk and mark-all marking is IMPLEMENTED, but broader object-level controls remain PARTIAL. |
| PostgreSQL model | PARTIAL | JPA entities plus a destructive reference `schema.sql`; JPA `ddl-auto=update` is authoritative at runtime. Schema/model mismatch risk exists. |
| Attendance | PARTIAL | Spring persists records and enforces duplicate uniqueness; manual and old UI paths can bypass parts of the recognition/business authority design. |
| Enrollment | CONFLICT | Python `/api/face/enroll` and real embedding engine exist, but active React admin enrollment sends random mock vectors to Spring face_data and does not call Python. |
| Recognition / Python | PARTIAL / CONFLICT | Python inference and Spring image proxy exist. React image path maps through Spring `FaceController` to Python; Python templates are separate from Spring face_data, and attendance marking uses a separate ordinary record call. |
| Documentation | CONFLICT | Master plan's “Python not implemented” status is outdated for the current tree. Integration/enrollment/API gaps remain. Specialized Python docs are absent from the discovered repository tree. |

**Critical current behavior:** no source-backed path completes Camera → actual detector/embedding → Spring recognition → valid attendance save. Recognition can fail closed through Spring's embedding endpoint because its configured default is localhost, but other frontend behavior can still mark attendance via ordinary teacher record APIs without biometric proof.

## 2. Complete Project Structure

- `frontend/`: React 18, TypeScript, Vite app; `src/App.tsx`, contexts, shared components/layout, admin/teacher/student pages, and many per-domain fetch services. `frontend/.env` and `.env.example` exist; `.env.example` points to port 8080 while Spring defaults to 8081. `node_modules/` is present locally but is not application source.
- `backend-v2/`: Maven/Spring Boot 3.3.4, Java 21. Source packages are `config`, `controller`, `dto`, `exception`, `model`, `repository`, `security`, `service`; resources include `application.properties` and `schema.sql`; five integration test classes are present.
- `Docs/`: six master documents `PRD.md`, `architecture.md`, `plan.md`, `rules.md`, `design.md`, `memory.md`; plus three portal-specific documents. These are not the requested specialized Python architecture/task files.
- Root also includes GSD configuration/workflows, `PLAN/*.txt`, import CSV templates, search/validation scripts, model capabilities, adapters, and `backend-v2.zip` (not used as implementation evidence).
- `python-ai/` contains `app/main.py`, `models/schemas.py`, `services/face_engine.py`, `utils/image_utils.py`, `data/templates.json`, `requirements.txt`, a runner, and CLI evaluation/enrollment/recognition scripts. Direct filesystem inspection confirmed these files despite their omission from the initial inventory.
- No Python automated test suite was found. `test_enrollment.py` and `test_recognition.py` are CLI verification programs, not test-runner tests. The two named Python architecture/tasks Markdown documents remain absent from the discovered project tree.
- No frontend unit/integration test files or test script are listed in `frontend/package.json`; no frontend API client generator or OpenAPI-derived contract tooling is configured.

## 3. Frontend Audit

**Application and route structure — STATUS: PARTIAL.** `frontend/src/App.tsx` uses React Router with AdminRoute, TeacherRoute, StudentRoute, root redirect, portal dashboards and several compatibility redirects. The portals/pages are present, but there are also older root pages (`Students.tsx`, `Teachers.tsx`, `Classes.tsx`, `Subjects.tsx`, `Timetable.tsx`, `Dashboard.tsx`, `AttendanceSessions.tsx`, `FaceManagement.tsx`) alongside newer portal-prefixed pages. This increases the likelihood that routes, data contracts, and visual behaviors diverge.

**JWT and auth — STATUS: PARTIAL.** `services/apiConfig.ts` stores token in `localStorage` as `fras_auth_token`, adds `Bearer` to requests. `authService.ts` stores a user JSON under `fras_current_user`; `AuthContext` restores this cached value without calling `fetchCurrentUser`. Login posts `/auth/login`, adapts `{token, username, name, role}` to a fallback user, which matches backend `AuthResponse`. JWT is readable by JavaScript and therefore exposed to XSS. `isUsernameTaken` calls missing `/users/check-username`; registration calls missing `/auth/register`; identity refresh calls missing `/auth/me`. On network failure `fetchCurrentUser` falls back to the cached user. `updateProfile` in authService only mutates localStorage; it does not persist profile changes.

**Role routing — STATUS: PARTIAL.** Client guards redirect based on cached user role; these are UX controls, not a security boundary. Admin may be routed to teacher/student views depending on explicit app redirects. Backend authorization must remain authoritative.

**Actual camera flow — STATUS: PARTIAL.** `LiveCameraSession.tsx` obtains a camera stream, draws video into canvas, encodes a PNG Data URL, then calls `faceService.recognizeImage`. `TeacherAttendanceStart.tsx` captures JPEG at quality .85 every 2.5 seconds and calls the same service. It posts `{imageData,fileName}` to `/api/face/recognize`; Spring `FaceController` proxies to Python `/api/face/recognize`. Python decodes the image, detects a face, generates a FaceNet512 embedding and compares against its local `templates.json` cache. The teacher page applies a frontend streak check then calls `/api/teacher/attendance-records` with student ID/confidence; it does not call Spring's biometric `/attendance-recognition` endpoint. Python cache is not synchronized with Spring admin enrollment.

**Face UI — STATUS: CONFLICT / LEGACY.** `pages/FaceManagement.tsx` calls `/face/status`, `/face/busy`, `/face/capture`, `/face/train`, `/face/recognize`. Status, busy and recognize are implemented by Spring `FaceController`; capture and train are absent. `pages/admin/FaceDataPage.tsx` is a separate admin flow. It captures five JPEGs, creates a normalized 512-number vector using `Math.random()`, labels it FaceNet512 and posts it to Spring `/admin/face-data`. This is a mock vector, not a derived embedding. Up to three base64 data URLs are posted in `sampleImagePaths`.

**Services and API behavior — STATUS: PARTIAL.** `teacherApi.ts` uses shared `fetchApi` and mostly maps to `/teacher/*`; `adminApi.ts` maps to `/admin/*`. `attendanceService.ts` calls an older `/attendance/*` route family absent from Spring. `faceService.ts` image recognition/status/busy calls map to Spring `FaceController`; capture/train calls do not. `FaceController` returns HTTP 200 with `success:false` on AI outages, so direct-fetch clients can treat service failure as an ordinary response. Recognition interval errors are swallowed in camera components.

**Mock/demo behavior — STATUS: IMPLEMENTED as demo content.** `services/mockData.ts` exists; landing page contains an explicit auto-simulation/demo interaction; notification service contains hard-coded sample notification text. `LiveCameraSession` uses a simulated READY state if mediaDevices is unavailable and a decorative simulated bounding box. It labels the overlay “OpenCV LBPH” despite its HTTP request being to the missing `/face/recognize` endpoint.

## 4. Backend Audit

**Stack and layers — STATUS: IMPLEMENTED.** Spring Boot 3.3.4 / Java 21, Spring Web/Security/Data JPA/Validation/Mail, PostgreSQL driver, JJWT 0.11.5, Apache POI 5.3.0, Springdoc 2.6.0. Controllers generally delegate to services and repositories; DTO records are used for much request/response handling.

**Main API map (all paths include `/api` prefix as shown).** Status here means source endpoint exists; matching frontend usage is stated separately.

| Method / path | Controller → service / effect | Authorization | Frontend / status |
|---|---|---|---|
| POST `/api/auth/login` | AuthController → AuthService; reads User, returns signed JWT | permitAll | authService; MATCH |
| POST `/api/auth/forgot-password`, `/reset-password`, `/change-password` | AuthController → AuthService/OtpService/UserService; OTP/password writes | auth paths permitAll, change-password controller requires principal | No complete matching frontend workflow found; change-password caller field names differ (`currentPassword` vs DTO `oldPassword`) |
| GET `/api/health`, `/health`, `/` | HealthController | public GET | health service; verify exact caller |
| POST `/api/face/recognize`; GET `/api/face/busy`, `/status/{studentId}` | FaceController → Python `/api/face/recognize`, `/busy`, `/status`; image JSON proxy; outage fallback is HTTP 200 | ADMIN or TEACHER | faceService calls these; mapped |
| GET/POST/PUT `/api/admin/academic-years[/{id}]`, `/{id}/set-active` | AdminController → AcademicYearService / DB | ADMIN | adminApi; source-backed |
| GET/POST/PUT/DELETE `/api/admin/departments`, `/classes`, `/subjects`, `/curriculum` and `/{id}` | AdminController → respective service/repository | ADMIN | admin pages/API; source-backed |
| POST `/api/admin/academics/import-combined`, `/departments/import`, `/classes/import`, `/subjects/import`, `/curriculum/import` | AdminController → AcademicImportService; parses workbook, persists rows | ADMIN | admin imports; source-backed |
| GET/POST/PUT `/api/admin/teachers[/{teacherId}]`, `/students[/{studentId}]`; deactivate/reactivate/import/delete-otp/delete | AdminController → TeacherService/StudentService/import services; user and domain records | ADMIN | Admin portal; source-backed |
| GET/POST/DELETE `/api/admin/teacher-class-assignments`, `/teacher-subject-assignments[/{id}]` | AdminController → TeacherAssignmentService; assignment records (timetable slot dependency check on subject assignment delete is IMPLEMENTED) | ADMIN | Admin portal; source-backed |
| GET/POST/PUT/DELETE `/api/admin/timetable[/{id}]` | AdminController → TimetableService; slot CRUD (teacher class and subject assignment checks on slot update are IMPLEMENTED) | ADMIN | Admin portal; source-backed |
| GET/POST `/api/admin/face-data/{studentId}`, `/face-data`; POST deletion OTP/delete/delete-secure | AdminController → FaceDataService/OTP; stores/deactivates embedding metadata | ADMIN | New FaceDataPage uses matching base endpoint; payload is simulated |
| GET/PUT `/api/admin/profile`; security/contact OTP routes; audit logs; `/health` | AdminController → profile/security/audit services | ADMIN | Admin profile mostly source-backed; check action-specific contracts |
| GET `/api/admin/correction-requests`, `/audit-logs`, `/audit-logs/session/{sessionId}`; POST review | AdminAttendanceWorkflowController → AttendanceService/audit repos | ADMIN | Admin workflow; source-backed |
| GET `/api/teacher/dashboard`, `/profile`, `/classes`, `/subjects`, `/classes/{id}/students`, `/timetable`, `/attendance-sessions` | TeacherController → dashboard/assignment/timetable services | TEACHER or ADMIN | Teacher API; source-backed, object-level checks vary |
| POST `/api/teacher/attendance-sessions`, `/quick-start`; records, bulk, mark-all-present | TeacherController → AttendanceService; create/update attendance | TEACHER or ADMIN | Teacher API; source-backed. Session teacher ownership check is IMPLEMENTED for bulk and mark-all-present |
| POST `/api/teacher/attendance-recognition`, `/multi-frame` | TeacherController → AttendanceService → FaceRecognitionService → configured Python `POST /recognize` embedding branch | TEACHER or ADMIN | APIs exist; camera uses image proxy and then ordinary record endpoint |
| GET review; POST submit-and-lock; correction requests; reports/export | TeacherController → AttendanceService/AttendanceReportService | TEACHER or ADMIN | Teacher API; source-backed |
| GET `/api/student/dashboard/{overall,subject-wise,monthly,semester-wise,history}` | StudentController → StudentDashboardService; read-only summaries | STUDENT or ADMIN | Student portal; source-backed |

No Spring mapping exists for `/api/attendance/*`, `/api/face/capture`, `/api/face/train`, `/api/auth/register`, `/api/auth/me`, or `/api/users/check-username`; frontend callers of these paths are unmatched. `/api/face/recognize`, `/busy`, and `/status` are implemented via `FaceController`. Database effects above follow code paths, but were not runtime-verified.

**Validation/errors — STATUS: PARTIAL.** `@Valid` appears on several DTO request bodies; DTO constraints vary and `MultiFrameRecognitionRequest` has no constraints for sessionId, frames, item fields, or threshold. `GlobalExceptionHandler` maps not-found, validation, bad credentials, illegal argument/state and generic exceptions. Generic exception response includes `ex.getMessage()` to clients and logs full exception. Some services use unchecked validation and some controller inputs are not validated.

**Transactions/concurrency — STATUS: PARTIAL.** AttendanceService methods use `@Transactional`; database uniqueness `(session_id, student_id)` and `(timetable_slot_id, session_date)` are concurrency backstops. No explicit lock/version annotations were found. Read-before-write duplicate checks can race and rely on DB constraint behavior; multi-frame loops synchronously call remote AI once per frame inside a transaction. No circuit breaker/retry/backoff or explicit connection pool/read timeout configuration is apparent.

## 5. Database Audit

**Entities/tables — STATUS: PARTIAL.** JPA model includes `AcademicYear`, `Department`, `ClassEntity`, `Curriculum`, `Subject`, `Teacher`, `Student`, `User`, `TeacherClassAssignment`, `TeacherSubjectAssignment`, `TimetableSlot`, `FaceData`, `FaceSample`, `AttendanceSession`, `AttendanceRecord`, `AttendanceCorrectionRequest`, `AttendanceAuditLog`, `AdminAuditLog`. Roles/status enums are Java enums. Main relations follow academic year→classes/students, department→classes/teachers/subjects, assignments→teacher/class/subject, timetable→class/subject/teacher, sessions→slot/class/subject/teacher, records→session/student/teacher, face data→student, samples→face data.

**Constraints/indexes/cascades — STATUS: PARTIAL.** Entity annotations and reference SQL define unique usernames/emails, student registration identifiers, one face_data per student, assignment uniqueness, timetable-slot uniqueness, one session per timetable slot/date, and one record per session/student. SQL declares ordinary indexes for class/year/student, teacher, timetable, session and attendance lookup. Cascades vary intentionally: face data/sample and attendance child rows cascade; several academic links restrict; user links may set null. `attendance_audit_logs` SQL declares no FKs. Confirm actual DB separately because Hibernate `ddl-auto=update` governs runtime and `spring.sql.init.mode=never` disables `schema.sql` initialization.

**Schema drift / hazard — STATUS: CONFLICT.** `schema.sql` starts by dropping all listed tables with `CASCADE`; it is explicitly destructive if run manually. `application.properties` calls it a reference artifact and uses Hibernate update. `schema.sql` is not synchronized as an enforced migration system. It omits an `admin_audit_logs` CREATE TABLE in the inspected table list despite a JPA entity/repository. SQL `face_samples.image_path` and entity samples are metadata only; raw face samples are not managed as a durable image store. JPA is authoritative at startup, so this review cannot claim the live PostgreSQL schema exactly equals `schema.sql` or entities.

## 6. Authentication & Authorization Audit

**JWT — STATUS: PARTIAL.** `AuthService.login` resolves username/email, authenticates with `DaoAuthenticationProvider`, BCrypt encoder, then `JwtTokenProvider` issues HS256 JWT with username subject, userId and role claims, 24h default expiry. `JwtAuthenticationFilter` validates bearer token and reloads `UserDetails` each request. Frontend uses localStorage bearer token. Backend default `JWT_SECRET` in `application.properties` is a known development placeholder; production safety depends on external override and minimum key strength. No refresh/revocation mechanism appears.

**Role gate — STATUS: PARTIAL.** `SecurityConfig` gates `/api/admin/**` to ADMIN, `/api/teacher/**` to TEACHER or ADMIN, `/api/student/**` to STUDENT or ADMIN; auth/docs and health are public. Spring method security is enabled, but reviewed routes rely mainly on URL policy. Frontend role routes do not replace backend checks.

**Object authorization gaps — STATUS: CONFLICT / HIGH.** `TeacherController.resolveTeacherId` pins TEACHER to username but allows ADMIN to supply a teacherId. Some writes invoke ownership checks: in `AttendanceService`, session teacher ownership check for `markBulkAttendance` and `markAllPresent` is IMPLEMENTED. However, checking assignment to class/subject, `getSessionReview(sessionId, teacherId)` session ownership check, and `submitCorrectionRequest` relationship validation remain OPEN / PARTIAL. These permit cross-session operations or data reads if a teacher can address another session ID. Manual `markAttendance` checks session owner when the teacher argument is non-null, but does not itself enforce student belongs to session class. Admin is explicitly allowed to use teacher endpoints; potential impersonation should be documented and intentionally constrained.

**Student ID binding — STATUS: PARTIAL.** `StudentController` allows STUDENT/ADMIN at path level and has `resolveStudentId` logic; any request parameter override policy must be treated carefully. Admin access is intentional for some operations. Student self-service must bind to authenticated account rather than trust a caller-provided ID; confirm helper behavior against user/student identifiers before release.

## 7. Attendance Audit

**Session/manual — STATUS: PARTIAL.** Spring creates sessions from timetable slots and checks duplicate slot/date; session response counts derive active class roster. `markAttendance` checks session not locked/completed and teacher/session owner when a teacher ID is supplied, looks up student, upserts the unique student/session record, saves marker/confidence and refreshes counts. `markBulkAttendance` and `markAllPresent` session teacher ownership check is IMPLEMENTED (assignment verification remains OPEN), and both upsert and refresh counts; mark-all assigns confidence `1.0` even though that is not biometric evidence. Frontend teacher attendance UI supports manual adjustments and separate ordinary attendance endpoints, so Spring is persistence authority but biometric recognition is not the sole authority.

**Recognition — STATUS: PARTIAL.** Single endpoint sends supplied embedding to Python adapter, only persists when adapter reports success, then delegates to markAttendance. It does not bind embedding to stored enrollment in Spring. Multi-frame endpoint accepts caller-supplied `studentId` and embedding per frame, counts successful Python results, requires two votes only when at least three frames are sent (otherwise one), validates student class, then persists. `threshold` is accepted but not used. The teacher screen does not call either of these endpoints; it calls image `/face/recognize`, then normal `/teacher/attendance-records` with an ID found from response. In the current tree neither image recognition nor actual AI is available.

**Manual authority — STATUS: CONFLICT with desired biometric policy.** Teacher UI offers manual single/bulk/mark-all record operations that persist without AI. These are real attendance APIs; determine whether operational policy allows them as override/fallback, and specify audit attribution. The product documents that Spring owns final business authorization, which current Spring does for writes in part, but the stated “no simulated recognition path remains” acceptance cannot be satisfied by current camera wiring.

## 8. Admin Portal Audit

**STATUS: PARTIAL.** Admin UI includes dashboard, academics (years/departments/classes/subjects/curriculum), students, teachers, assignments, timetable, face data and admin profile/security. Backend exposes matching controller routes. Excel import uses POI service. Admin OTP/audit features exist in code. The old general `FaceManagement` screen/service has a distinct API contract that is absent. Admin enrollment's five camera images are not sent as images for inference; random 512 vector and data URLs are sent into metadata fields. Admin profile/settings also include client-side local-only service methods in older service code, so verify each screen uses current `adminApi` before treating it as persisted.

## 9. Teacher Portal Audit

**STATUS: PARTIAL.** Teacher dashboard/classes/subjects/students/timetable, attendance sessions, history, reports/export, profile and correction request pages exist. Spring endpoints support these categories. Roster access and session/report visibility must be checked for per-teacher ownership on every service method; reviewed session review lacks checks (OPEN), while session teacher ownership check on bulk marking is IMPLEMENTED. Camera recognition page uses stale image API and marks via ordinary record endpoint after UI-level 5-frame streak; stale API cannot currently return a match.

## 10. Student Portal Audit

**STATUS: PARTIAL.** Student dashboard, attendance summaries/history, timetable and profile screens exist; backend exposes dashboard/history APIs but reviewed StudentController does not expose profile or timetable endpoints. Check those pages' exact services and whether they use local cached/demo data or teacher/admin APIs; no dedicated student timetable/profile backend mappings are present in the controller inventory. Student read API role gate includes ADMIN. No student face enrollment path is evident in the student portal.

## 11. Face Enrollment Audit

**STATUS: CONFLICT.** Newer admin flow exists at `pages/admin/FaceDataPage.tsx`; real Spring registration endpoint and `FaceDataService` validate nonblank embedding and student existence, compare against other active completed vectors with cosine similarity threshold .85, allow same-student re-enrollment, write one `FaceData` embedding/model/version and completion status, and create sample metadata rows. But the submitted vector is random client data, not inferred from frames. Duplicate detection therefore compares random pseudo-vectors, has no dependable biometric meaning, and reads all active face rows into memory (O(enrollments)). Sample image paths are in fact base64 values and no image persistence contract is present. Front/Left/Right capture, image quality, face detection, liveness and true multi-template storage are absent. One stored embedding per student is modeled; `FaceSample` holds image-path/index metadata, not multiple independently comparable embedding templates. Deletion marks inactive/status and clears embedding; entity relation behavior preserves student.

Legacy enrollment in `FaceManagement.tsx` calls missing capture/status/busy/train endpoints and claims 20 images/LBPH model training; no corresponding Spring controller or Python implementation exists. Do not report it as implemented.

## 12. Face Recognition Audit

**STATUS: PARTIAL / CONFLICT.** There are three related but inconsistent contracts:

1. Active camera: image Data URL → `FaceController POST /api/face/recognize` → Python `/api/face/recognize` image branch `{imageData,fileName}` → FaceNet512 embedding → comparison against Python's local `templates.json` (or caller-provided enrolled faces).
2. Spring attendance recognition adapter: TeacherController `POST /api/teacher/attendance-recognition` accepts `sessionId`, `studentId`, `embeddingData`, status, teacher ID; multi-frame accepts embeddings. `AttendanceService` → `FaceRecognitionService` → Python `/recognize` embedding branch. This is separate from the active camera path.
3. Admin enrollment: React generates random vector → Spring `/api/admin/face-data`; Python `/api/face/enroll` supports real image frames and returns a template, but no frontend/Spring enrollment proxy calls it.

Enrollment's `/api/admin/face-data` writes random pseudo-embedding. Python's image endpoint compares against its separate local JSON cache, not Spring face_data. Spring embedding recognition also checks the Python cache; Spring does not supply enrollment synchronization. `FaceController` returns AI failure as HTTP 200. Camera recognition can reach ordinary attendance record API after client-side matching, but the recognized ID is not bound server-side to the biometric result. No liveness or anti-spoof check exists; the overlay includes demonstrative LBPH labeling/bounding box.

## 13. Python AI Audit

**Python service — STATUS: PARTIAL IMPLEMENTATION.** `python-ai/app/main.py` is FastAPI with health, busy, status, image/embedding recognition, enrollment, multi-frame and vector-compare endpoints. `services/face_engine.py` imports DeepFace, builds `Facenet512`, uses OpenCV detector, extracts and L2-normalizes 512-dimensional embeddings, computes cosine distances, aggregates enrollment vectors and persists a local JSON template cache. `utils/image_utils.py` decodes base64/Data URLs and checks minimum dimensions. `models/schemas.py` defines Pydantic request/response models. `requirements.txt` includes DeepFace, tf-keras, FastAPI, uvicorn, OpenCV, NumPy and other dependencies. `run.py` binds default `0.0.0.0:8000`.

| Capability | Status | Evidence / limit |
|---|---|---|
| FastAPI service/endpoints | IMPLEMENTED | `/health`, `/api/face/*`, `/recognize`, `/enroll`, `/recognize-multi-frame`, `/compare` |
| DeepFace + FaceNet512 inference | IMPLEMENTED in code | `face_engine.py`; model download/load and inference not run during this audit |
| OpenCV face detection | IMPLEMENTED | DeepFace detector backend `opencv`; single/multiple-face checks |
| Embedding aggregation/comparison | IMPLEMENTED | normalized mean template, cosine distance matching |
| Image enrollment | PARTIAL | Python endpoint and CLI exist; active UI does not call it; local JSON persistence only |
| Front/left/right enrollment | PARTIAL | `PoseFrames` schema and endpoint support frame groups; no active UI integration or tested pose validation |
| Multi-frame recognition | PARTIAL | Python image-frame quorum endpoint exists; different from Spring's embedding-vote contract |
| Quality checks | PARTIAL | minimum image dimensions, detection confidence and face box size; no broad blur/lighting/pose checks |
| Liveness/anti-spoof | MISSING | Health schema explicitly reports unsupported |
| Template store | PARTIAL | in-memory dict + local `data/templates.json`; no Spring synchronization or vector index |
| API authentication | MISSING | FastAPI routes have no auth; CORS allows `*` with credentials; runner binds 0.0.0.0 |
| Request/rate/concurrency limits | MISSING/UNKNOWN | no explicit body/frame limits or rate controls found |
| Automated tests | MISSING | named test scripts are CLI programs, no pytest/unittest suite found |
| Accuracy evaluation | PARTIAL | dataset evaluator exists, but no benchmark was executed and evidence depends on genuine labeled images |

The two specialized Python reference documents named in the request are absent from the discovered repository tree, so their detailed requirements remain unaudited. `Docs/plan.md`'s blanket Python service “not implemented” label is outdated; integration, production hardening, automated testing and end-to-end workflow remain incomplete.

## 14. API Contract Audit

| Contract | Status | Evidence |
|---|---|---|
| React login → Spring login | MATCH with response adaptation | `authService.login`, `AuthController`, `AuthResponse` |
| React `/attendance/*` legacy service → Spring | MISSING | `attendanceService.ts`; no controller mappings under `/api/attendance` |
| React `/face/status`, `/face/busy`, `/face/recognize` → Spring | MATCH for routes | `faceService.ts` → `FaceController` → Python proxy |
| React `/face/capture`, `/face/train` → Spring | MISSING | no matching Spring/Python mappings; legacy FaceManagement calls |
| Teacher camera image recognition | PARTIAL | imageData → Spring `FaceController` → Python DeepFace; result then flows to ordinary attendance-record route |
| Spring attendance `/recognize` embedding contract → Python | PARTIAL | route and schema branch exist; Spring face_data is not synchronized to Python template cache |
| Spring → Python authentication | MISSING | no service credentials on proxy, no FastAPI auth |
| Python image enrollment | IMPLEMENTED in Python, unintegrated | `/api/face/enroll`; no active React/Spring caller |
| New admin face data registration | PATH MATCH, DATA INVALID | `adminApi.registerFaceData` to `/api/admin/face-data`; random embedding and data URLs used as paths |
| Student/teacher registration/check username | MISSING | `authService.registerUser` and `isUsernameTaken`; backend has no mappings |
| Current user refresh `/auth/me` | MISSING | `authService.fetchCurrentUser`; backend has no mapping |
| Change password | FIELD MISMATCH | frontend submits `currentPassword`; `ChangePasswordRequest`/controller uses `oldPassword` |
| frontend API base config | CONFLICT | `.env.example` says localhost:8080; application defaults to 8081; frontend default is 8081 |

The modern teacher/admin services use `fetchApi` with root paths. Some legacy services construct endpoints independently, creating duplicate data-access conventions and inconsistent response/error mapping.

## 15. Security Audit

- **JWT secret — STATUS: CONFLICT / HIGH.** `application.properties` supplies a known local-development fallback. Safe production deployment requires externally injected strong secret; source does not enforce a production profile or fail startup on placeholder.
- **Token storage — STATUS: PARTIAL.** JWT held in browser localStorage; XSS can exfiltrate it. No evidence of CSP/security headers in inspected config.
- **Authorization — STATUS: PARTIAL / HIGH.** URL role gates exist; object-level authorization gaps remain as detailed above. Python routes have no authentication. Spring's FaceController is teacher/admin protected, but Python binds to `0.0.0.0` by default and can be reached directly if network policy permits.
- **CORS — STATUS: PARTIAL.** `CorsConfig` allows credentialed requests only from localhost/127.0.0.1 origin patterns. This is dev-only; production origin configuration needs deployment-specific control. OPTIONS permitted.
- **Python exposure — STATUS: HIGH.** `python-ai/app/main.py` allows wildcard origins/methods/headers with credentials; `run.py` binds `0.0.0.0:8000` by default. No API key, JWT, service credential, or rate limit protects Python endpoints. CORS is not access control; network access needs independent restriction.
- **Password handling — STATUS: PARTIAL.** BCrypt configured. `AuthService` checks current password. Frontend minimum change password length is 4; server DTO constraints must be the authority. Reset OTP workflow uses service; inspect `OtpService`/mail wiring before production. `AdminSecurityVerificationService` logs mock email content when mail disabled (including development codes), and may generate OTP delivery records without external delivery.
- **Biometrics — STATUS: HIGH RISK / INVALID CURRENT IMPLEMENTATION.** Enrollment sends random generated vector; up to three full Data URLs may be stored in fields named image paths. No raw-image lifecycle, encryption-at-rest policy, consent/retention mechanism, service-to-service auth, or payload cap was found in app source.
- **Request controls — STATUS: PARTIAL.** No rate limiting or upload/body-size limits are apparent. Multi-frame payload has no bean validation and can cause synchronous arbitrary-size iteration/remote calls.
- **Error/log exposure — STATUS: PARTIAL.** Generic exception response surfaces exception messages; AI error message may contain network exception details. DEBUG app logging and SQL logging disabled; no dedicated structured audit of all security-sensitive actions confirmed.
- **Replay/injection — STATUS: PARTIAL.** No server nonce/session challenge or liveness proof exists. Caller-supplied IDs/embeddings are replayable/injectable. Attendance duplicate uniqueness limits duplicate row creation, but does not verify physical presence.
- **Secrets/config — STATUS: UNKNOWN in real env.** `.env` exists but its values are deliberately not reproduced here. External deployment secret values were not inspected or exposed in this report.

## 16. Performance & Reliability Audit

- Camera UI captures/calls every 2.5 seconds in teacher path, encoding JPEG/base64; generic LiveCameraSession loop frequency should be reviewed in component source. Requests can overlap when inference exceeds interval; there is no in-flight guard/cancellation or backpressure.
- Base64 image and multiple frame payloads increase request size and memory use. No configured maximum body/request size was found.
- Spring multi-frame work performs one sequential remote call per supplied frame within DB transaction; timeout property is declared but `RestClient` has no explicit timeout setup in `FaceRecognitionService`. A slow Python dependency can hold DB transaction open.
- Face duplicate lookup loads all active face records and parses vectors linearly; no vector index/cache.
- Attendance count refresh and repeated per-student lookups can create N+1/query amplification, especially bulk mark-all and session review/report paths. Exact query plans were not available.
- No retry policy, circuit breaker, queue, cache, or graceful degradation beyond AI failure result exists. Frontend sometimes swallows AI errors, producing silent stalls.
- Local configuration ports differ (`.env.example` 8080; Spring 8081; API default 8081), creating deployment/setup failure risk.
- `schema.sql` destructive drop statements make manual execution hazardous; application does not execute it automatically.

## 17. Testing Audit

**Backend tests — STATUS: PRESENT, NOT EXECUTED.** Five test classes exist: `AttendanceApplicationTests`, `AttendanceWorkflowIntegrationTest`, `AuthControllerIntegrationTest`, `RemainingFeatureIntegrationTest`, `TeacherAssignmentIntegrationTest`. They use Spring Boot tests/H2 and exercise login/JWT/OTP, attendance workflows, remaining feature APIs and teacher assignments. This is not proof of current passing status; tests were not run. They do not establish PostgreSQL-specific behavior, Python integration, image/embedding correctness, production authorization completeness, or performance/concurrency.

**Frontend tests — STATUS: MISSING.** No first-party frontend test/spec files or test script were found. `package.json` includes build and lint only.

**Integration gaps — STATUS: MISSING.** No React↔Spring contract test, Spring↔Python integration test, model inference test, real PostgreSQL migration/schema test, camera test, face enrollment/recognition end-to-end test, rate/replay test, or role/object authorization matrix is evident in source test inventory.

## 18. Legacy / Dead / Duplicate Code

- **LEGACY / unmatched routes:** `attendanceService.ts` `/attendance/*` and `faceService.ts` `/face/capture`, `/face/train` are unmatched. Other `/face/*` calls are mapped through Spring `FaceController`.
- **DUPLICATE portals/services:** old root portal pages and new `pages/admin`, `pages/teacher`, `pages/student` trees coexist, along with legacy and modern API services.
- **MOCK:** `FaceDataPage.tsx` random FaceNet512 vector; `Landing.tsx` workflow simulator; `mockData.ts`; fixed notification examples; LiveCameraSession simulation fallback and drawn recognition box.
- **MISLEADING UI LABELS:** “OpenCV LBPH” live recognition while actual newer backend adapter expects FaceNet512 embedding; FaceNet512 enrollment label though random data is used; Settings references LBPH tuning but no model API/config is in Spring.
- **UNUSED/UNMATCHED auth methods:** registration, username availability, current-user refresh refer to absent endpoints. Some profile services update local state only.
- **DUPLICATE attendance behavior:** older generic Attendance pages/service coexist with TeacherAttendanceStart/teacherApi. They have different endpoint families and record models.
- Confirming exact dead imports/components requires static usage graph or linter output; no build/lint was run, so unused-code status beyond unmapped service paths remains UNKNOWN.

## 19. Documentation vs Code Conflicts

| Document | Status vs code | Required cross-check |
|---|---|---|
| `Docs/PRD.md` | PARTIAL/CONFLICT | Python/FaceNet512 are present in source now. Spring authority requirements remain incompletely met: active camera posts ordinary record after recognition, Python templates are unsynced, liveness absent, and admin UI generates a random vector. |
| `Docs/architecture.md` | CONFLICT if read as current system; valid target architecture | Python and Spring proxy exist. Update Python-missing claims; local JSON store, public Python exposure, enrollment divergence, mapped endpoints and attendance handoff need an as-built description. |
| `Docs/plan.md` | OUTDATED current status | Its Python “not implemented” label is contradicted by current source. Preserve remaining integration/auth/testing/production gates as pending. |
| `Docs/rules.md` | UNKNOWN/PROCESS | Treat as policy rather than implementation proof. Cross-check current repository guidance but no runtime feature status follows from it. |
| `Docs/design.md` | PARTIAL/CONFLICT | Target recognition/enrollment states are planned; UI currently has simulated states, no liveness/quality, and different active API flow. Mark screens/protocol as target design. |
| `Docs/memory.md` | UNKNOWN/likely stale session memory | It is a memory artifact, not source truth; reconcile status claims with audit findings before implementation resumes. |
| Python Architecture + Tasks | MISSING from repository | The two named references were not found by filename; cannot audit their particular assertions. Do not infer them from master architecture text. |

The master docs should preserve their six-file structure as requested. Do not copy the same current-state narrative into a second permanent architecture document; update status and actual-vs-target distinctions inside the existing six files after review.

## 20. Missing Features

**MISSING**: liveness/anti-spoofing; Python/Spring service authentication; Python/Spring template synchronization; authenticated Python endpoints; controlled biometric retention/consent; request-size and rate limits; face recognition and enrollment E2E tests; frontend tests; configured production secrets/CORS policy; server-side user registration/username lookup/current-user endpoint; server-side student profile/timetable endpoints (as named UI pages suggest); migrations as a controlled non-destructive schema evolution mechanism; complete ownership authorization for teacher actions.

**PARTIAL**: production-ready Python AI integration (the code/service and image inference path exist, but no runtime verification, hardening, sync, or complete attendance integration); real image quality validation; multi-angle enrollment; durable template lifecycle (Python local JSON and separate Spring table); benchmark evidence.

**PARTIAL**: academic-year/class/department/subject/curriculum management, imports, teacher/student administration, assignments, timetable, dashboards, manual attendance, corrections/audits, JWT role access, OTP/security profile workflows.

## 21. Critical Issues

1. **P0 – Biometric result is not server-bound to attendance:** image recognition is proxied and Python inference exists, but teacher UI follows it with ordinary attendance-record API. The server does not verify that the supplied attendance student ID came from the recognition result.
2. **P0 – False biometric enrollment:** `FaceDataPage.tsx` persists `Math.random()` vector as FaceNet512 and labels it a valid enrollment; recognition cannot derive or verify against it.
3. **P1 – Attendance authorization gaps:** session teacher ownership verification for bulk and mark-all service paths is IMPLEMENTED; assignment verification and review path ownership check remain OPEN. Review and fix before relying on attendance records as trustworthy.
4. **P1 – Manual path bypasses biometric proof:** camera page posts ordinary attendance record after frontend-only match; manual APIs can mark present independently of AI. Product authority/fallback rule needs explicit status and audit requirements.
5. **P1 – Python service exposed without auth:** runner binds 0.0.0.0 and FastAPI allows wildcard CORS; service routes have no authentication or rate/body limits.
6. **P1 – Placeholder JWT secret:** a known fallback is shipped; production startup does not reject it.
7. **P1 – Biometric enrollment split/invalid:** UI stores random vectors in Spring while Python enroll endpoint writes local JSON; base64 frames may be stored in sample path fields.
8. **P1 – Multiple stale API generations:** legacy services call missing endpoints; users can encounter broken flows and documentation may misstate functionality.
9. **P2 – Destructive schema script and live-schema uncertainty:** SQL starts with DROP TABLE CASCADE, while JPA update is active and SQL init is disabled.
10. **P2 – Missing Python reference docs from tree:** detailed specialized-doc comparison cannot be completed from this checkout.

## 22. Recommended Implementation Order

This is a suggested order only; this audit did not implement anything.

1. Reconcile the six master docs to a clearly labeled **as-built** status baseline: Python service code exists, while its Spring enrollment/template and attendance integrations remain incomplete; supply the two specialized Python references.
2. Close authorization gaps and define teacher/admin/student object-access rules; add explicit policy for manual, bulk and mark-all attendance.
3. Remove or visibly disable fake biometric enrollment/demo paths from production flows; agree the real enrollment data contract and privacy lifecycle before generating embeddings.
4. Define one recognition/enrollment contract across React, Spring, and Python. Resolve image-vs-embedding ownership, template synchronization and attendance result authority before changing API code.
5. Harden and authenticate the existing Python AI service and Spring proxy; add bounded payloads/timeouts and no-inference-failure attendance behavior.
6. Align frontend services/routes with the actual backend API; retire unmatched legacy clients or implement them only if requirements retain them. Correct environment-port defaults.
7. Establish non-destructive schema migrations and reconcile JPA entities, SQL schema, FKs/indexes/constraints and audit entities.
8. Add backend authorization/attendance/contract/DB integration tests and frontend tests; add AI contract and end-to-end tests when service exists.
9. Add operational security/performance controls: production secret enforcement, CORS policy, rate/payload limits, request cancellation/backpressure, observability, and privacy retention controls.
10. Update docs only as each implementation phase is evidenced; do not promote planned model/security features to IMPLEMENTED based on names or UI labels.

## 23. Master Documentation Changes Required

Keep `PRD.md`, `architecture.md`, `plan.md`, `rules.md`, `design.md`, and `memory.md` as the authoritative six-document set.

- **PRD:** retain target requirements and separate status. Describe implemented React image → Spring FaceController → Python recognition, the separate embedding attendance endpoint, random-vector admin enrollment and unsynced template stores. Clarify whether manual/bulk attendance is an allowed operational override.
- **architecture:** add an as-built topology and table/API mapping; show active image proxy, separate embedding API, Python local JSON template store, enrollment gap, public service exposure, legacy paths and DB initialization (`ddl-auto=update`, SQL init disabled). Classify Python code as present, integration as partial.
- **plan:** update the Python service status to implemented-in-code but not production integrated; include auth/ownership gaps, stale endpoints, random enrollment, template sync, schema migration and test gaps as prerequisites. Do not mark portal feature complete solely because UI/backend pages exist.
- **rules:** clarify documentation status semantics so a modeled entity, UI label, stub/adapter, and tested integration cannot be conflated with an operational feature.
- **design:** tag unimplemented states and planned views; remove claims of working liveness/quality/anti-spoof from current UI status; document actual error/loading behavior and camera API contract as target only until aligned.
- **memory:** replace stale implementation assumptions with this verified baseline after audit acceptance; keep session notes subordinate to code and master status.
- **Specialized Python docs:** the two named Python architecture/task documents were not found in the discovered repository tree; add/provide them before detailed claim-by-claim comparison. Their absence here does not negate the Python source files now inspected.

---

**Audit boundary:** Static code inspection only. No app code or existing master documentation was edited; no tests/builds were run. Python model load/inference and live service behavior remain unverified. Recommendations are not implementation decisions.
