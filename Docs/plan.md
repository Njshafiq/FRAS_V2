# FRAS V2 — Master Implementation Plan

**Role:** Execution roadmap, dependencies, gates and current status.

## 1. Current State
### Implemented/source-backed
- React/Vite/TypeScript frontend
- Spring Boot backend
- PostgreSQL integration
- JWT login and role gates
- global CORS
- academic/teacher/student/attendance/face-data APIs
- CSV/XLSX import
- OTP-protected face-data deletion
- native camera capture
- Spring recognition DTOs/endpoints
- backend multi-frame voting logic

### Partial
- object-level authorization
- portal completeness
- frontend/backend API alignment
- schema management
- Spring AI adapter
- biometric administration

### Missing/conflict
- Python service
- real image→embedding pipeline
- real FaceNet512 inference
- real multi-angle enrollment
- real multi-template comparison
- liveness
- anti-spoof
- threshold calibration
- final React/Spring/Python contract
- biometric E2E flow
- frontend tests

## 2. Implementation Order
```text
Baseline
→ backend/security stabilization
→ frontend/API alignment
→ Python foundation
→ image processing
→ multi-angle enrollment
→ basic recognition
→ multi-frame
→ Spring/Python integration
→ liveness
→ anti-spoof
→ threshold calibration
→ robustness
→ performance
→ security
→ E2E tests
→ deployment
```

## 3. Phase 0 — Documentation Freeze
Tasks: finalize six master files, status vocabulary, as-built/target separation, architecture decisions, Python references.  
Gate: docs match source and do not present planned features as implemented.

## 4. Phase 1 — Backend Stability / Authorization
Run backend build/tests; verify auth; inspect teacher object-level authorization; verify sessions, duplicate behavior, bulk/mark-all/review ownership, face-data administration, OTP deletion and PostgreSQL behavior; define manual/bulk attendance policy.  
Gate: secure non-AI attendance.

## 5. Phase 2 — Frontend/API Alignment
Inventory services; align paths; retire unmatched `/api/face/*` and `/api/attendance/*` where not required; normalize API base; verify JWT/session/attendance flows; remove silent biometric→manual fallback.  
Gate: one authoritative Spring API surface.

## 6. Phase 3 — Enrollment Contract
Freeze image format, endpoint, Front/Left/Right flow, frame count, quality rules, template storage, model/version metadata, update/delete and privacy lifecycle.  
Gate: approved real-enrollment contract.

## 7. Phase 4 — Python Foundation
Create service, pinned dependencies, config, health endpoint, structured errors, correlation IDs, request validation and service authentication.  
Gate: Spring securely reaches Python.

## 8. Phase 5 — Image Processing
OpenCV decoding, validation, face detection, one-face validation, alignment, quality metrics and preprocessing.  
Gate: real frame produces validated face-processing output.

## 9. Phase 6 — Multi-Angle Enrollment
Front/Left/Right, multiple good frames, quality filtering, FaceNet512, template consistency, metadata, duplicate/update/delete behavior and cache refresh.  
Gate: real multi-template enrollment.

## 10. Phase 7 — Basic Recognition
Live frame→embedding, template comparison, distance/similarity, candidate selection, unknown handling, model/version tracking.  
Gate: known vs unknown works under controlled tests.

## 11. Phase 8 — Multi-Frame Recognition
Frame window, evidence collection, agreement/quorum, failed-frame handling, inconsistent candidates and aggregation.  
Gate: one noisy frame cannot authorize attendance.

## 12. Phase 9 — Spring/Python Integration
Replace embedding-only placeholder with final image/frame contract; authenticate service; bounded timeout; validate result; map errors; connect attendance; remove fake fallback; retire obsolete endpoints.  
Gate: React→Spring→Python→Spring→PostgreSQL works with real biometric evidence.

## 13. Phase 10 — Liveness
MediaPipe landmarks, temporal signals, supporting blink/pose signals, challenge-response if required, timeout/retry.  
Gate: tested liveness policy.

## 14. Phase 11 — Anti-Spoof
Evaluate selected method; define semantics; test print/screen/replay attacks; safe unavailable behavior.  
Gate: tested anti-spoof policy.

## 15. Phase 12 — Threshold Calibration
Genuine/impostor dataset, distance analysis, false acceptance/rejection, threshold selection, versioning.  
Gate: evidence-based production threshold.

## 16. Phase 13 — Robustness
Test no/multiple faces, blur, low light, pose, occlusion, malformed image, camera failure, unknown, inconsistent frames, liveness/spoof failure, AI unavailable/timeout, duplicate, closed session and unauthorized class.  
Gate: safe failure.

## 17. Phase 14 — Performance
Measure capture, image size, Base64, transport, inference, DB, lookup, concurrency, CPU/RAM and transaction duration. Investigate in-flight guards, cancellation/backpressure, caching/indexing and query optimization.  
Gate: measured targets.

## 18. Phase 15 — Security
Remove placeholder secrets; production CORS; Spring→Python authentication; payload limits; rate/concurrency controls; object authorization; token-storage review; biometric retention; logging; dependency scan.  
Gate: security review passes.

## 19. Phase 16 — Testing
Backend unit/integration/authorization/concurrency/DB tests; frontend API/auth/camera/error tests; Python inference/quality/liveness/anti-spoof tests; cross-service and end-to-end tests.  
Gate: critical acceptance scenarios pass.

## 20. Phase 17 — Schema Safety
Compare JPA to real PostgreSQL; introduce non-destructive migrations; verify FKs/indexes/unique constraints; reconcile audit tables; stop treating destructive `schema.sql` as production migration.  
Gate: repeatable schema evolution.

## 21. Phase 18 — Deployment
Environment config, frontend, Spring, Python, PostgreSQL, secrets, TLS, internal networking, backups, monitoring and recovery.  
Gate: repeatable/recoverable deployment.

## 22. Definition of Done
A feature is done only when implementation, API contract, validation, failure handling, tests, security review and documentation all agree.

## 23. Major Risks
False acceptance; false rejection; AI unavailable; model mismatch; high inference latency; slow template lookup; biometric leakage; frontend/backend drift; duplicate attendance; schema drift; AI-agent architecture drift; legacy API confusion.
