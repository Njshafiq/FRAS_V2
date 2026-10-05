# FRAS V2 — Master Engineering Rules

**Role:** Non-negotiable engineering guardrails for developers and AI agents.

## 1. Documentation
1. The only permanent master set is `PRD.md`, `architecture.md`, `plan.md`, `rules.md`, `design.md`, `memory.md`.
2. Do not create duplicate permanent architecture/analysis docs.
3. Use `IMPLEMENTED`, `PARTIAL`, `PLANNED`, `MISSING`, `CONFLICT`, `LEGACY`, `OPEN` accurately.
4. UI labels, DTOs, comments and adapters are not proof of implementation.
5. Never claim runtime/test success without evidence.

## 2. Architecture
1. React → Spring.
2. React must not directly call Python.
3. Spring is application/business authority.
4. Python is biometric authority.
5. Python never writes attendance.
6. PostgreSQL is persistent source of truth.
7. Do not duplicate responsibilities or APIs to hide mismatches.

## 3. Frontend
1. Use centralized API client.
2. Keep JWT handling centralized.
3. API paths must match Spring controllers.
4. Camera captures evidence only.
5. Never generate random/fake production embeddings.
6. Never simulate successful recognition in production attendance.
7. Do not store raw frames unnecessarily.
8. Handle loading/empty/error/unauthorized/unavailable states.
9. Never silently turn biometric failure into manual attendance.
10. Retire legacy endpoints only after replacement is verified.

## 4. Backend
1. Validate all client input.
2. Validate AI responses.
3. Never trust client recognition success.
4. Check session state.
5. Check teacher assignment/object ownership.
6. Check class/subject/student eligibility.
7. Prevent duplicate attendance.
8. AI failure must not create attendance.
9. Keep biometric processing separate from attendance rules.

## 5. Authorization
1. Admin operations require Admin authority.
2. Teacher operations require object-level assignment/ownership checks.
3. Student operations are scoped to the authenticated student.
4. URL role checks are not sufficient for resource ownership.
5. Bulk/mark-all/review/session actions need explicit authorization.

## 6. Database
1. PostgreSQL is authoritative.
2. Use FKs and appropriate unique constraints.
3. Do not store unnecessary raw images.
4. Template changes invalidate stale runtime recognition data.
5. Schema changes require migration safety.
6. Do not execute destructive schema scripts in production.
7. `ddl-auto=update` is not a complete production migration strategy.

## 7. APIs
1. Every API has an explicit request/response contract.
2. Path/method/body must match exactly.
3. Errors must be explicit.
4. Do not maintain duplicate recognition contracts.
5. Internal AI APIs are not public frontend APIs.
6. Image data ≠ embedding data.
7. Final recognition API must accept the actual evidence produced by the camera pipeline.

## 8. Authentication
1. Browser auth uses JWT unless explicitly changed.
2. Authorization remains server-side.
3. Never expose service credentials to browser.
4. Spring→Python authentication is required before production.
5. Never ship a known placeholder JWT secret.
6. Production secrets must be external and validated.

## 9. Enrollment
1. Never generate random vectors as face embeddings.
2. Never label mock vectors as FaceNet512.
3. Enrollment uses real image evidence.
4. Reject poor samples.
5. Prefer Front/Left/Right multi-template enrollment.
6. Record model/version metadata.
7. Handle duplicate/update/delete explicitly.
8. Refresh/invalidate runtime template state after changes.

## 10. Recognition
1. Python performs biometric processing.
2. Spring owns attendance.
3. Recognition uses real image evidence.
4. Recognition uses multi-frame evidence.
5. One frame cannot independently authorize attendance.
6. Quality is checked before identity is trusted.
7. Liveness is separate from identity.
8. Blink alone is insufficient liveness.
9. Anti-spoof failure blocks biometric attendance.
10. Thresholds require genuine/impostor calibration.
11. Thresholds must not automatically drift.
12. Model preprocessing, normalization, metric and version must be verified from running implementation.

## 11. Python
1. Dedicated biometric service.
2. No attendance repository access.
3. No attendance writes.
4. Process frames in memory where practical.
5. Validate payloads.
6. Return structured results.
7. Distinguish biometric failure states.
8. Never turn processing failure into match success.
9. Control model/dependency versions.
10. Runtime cache/index is not source of truth.
11. Do not introduce a vector DB without explicit need.

## 12. Liveness / Anti-Spoof
1. Treat liveness separately.
2. Blink/head movement alone is not proof.
3. Do not claim software liveness equals depth/IR hardware.
4. Test photo, screen and replay attacks.
5. Do not claim anti-spoof merely because a library exposes a feature.
6. If required anti-spoof is unavailable, fail safely.

## 13. Attendance
1. Spring is final authority.
2. Python supplies evidence only.
3. Session must be valid/open.
4. Teacher must be authorized.
5. Student must be eligible.
6. Duplicate attendance must be rejected.
7. AI failure cannot produce success.
8. Manual and biometric attendance remain distinguishable.

## 14. Security / Privacy
1. Protect biometric information.
2. Never log raw images.
3. Avoid logging complete embeddings.
4. Protect secrets.
5. Restrict Python network access.
6. Enforce timeouts, payload limits and suitable rate/concurrency controls.
7. Use explicit production CORS.
8. Review token storage/XSS exposure.
9. Do not expose internal exception details.
10. Minimize biometric retention and define deletion.

## 15. Performance
1. Measure before optimizing.
2. Measure inference/network/DB/template lookup/concurrency.
3. Prevent uncontrolled overlapping frame requests.
4. Avoid unnecessary long transactions around remote AI.
5. Add cache/index only with invalidation rules.
6. Never trade away security for speed.

## 16. Errors
Use explicit states such as:
```text
NO_FACE
MULTIPLE_FACES
LOW_QUALITY
LIVENESS_FAILED
ANTI_SPOOF_FAILED
UNKNOWN_FACE
INSUFFICIENT_EVIDENCE
AI_TIMEOUT
AI_UNAVAILABLE
SESSION_CLOSED
UNAUTHORIZED_CLASS
DUPLICATE_ATTENDANCE
PROCESSING_ERROR
```
No silent success.

## 17. Testing
Critical tests cover authentication, object authorization, session lifecycle, duplicate/concurrency, image decoding, quality, genuine/impostor, liveness, anti-spoof, AI unavailable/timeout, React↔Spring, Spring↔Python, PostgreSQL migrations and end-to-end biometric attendance.

## 18. AI-Agent Rules
1. Read all six master files first.
2. Inspect source before changes.
3. Do not invent endpoints.
4. Do not create duplicate services to hide uncertainty.
5. Do not generate fake biometric data.
6. Do not change thresholds without calibration evidence.
7. Do not introduce architecture without an explicit decision.
8. Preserve working functionality unless change is required.
9. Update the correct master document after approved architecture changes.
10. If uncertain, use `OPEN`, not a guess.
11. Never claim end-to-end support when a boundary is missing.

## 19. Forbidden
Browser→Python direct calls; Python→attendance DB writes; fake/random embeddings; simulated recognition; automatic threshold weakening; one-frame authoritative attendance; duplicate recognition APIs; hardcoded production secrets; authorization bypasses; unnecessary raw-image persistence; destructive production schema execution; planned-as-implemented documentation.
