# FRAS V2 — FaceNet512 Biometric AI Microservice

This microservice provides the dedicated biometric facial recognition engine for FRAS V2 using **DeepFace** and **FaceNet512**.

## Architecture Boundaries
- **Spring Boot Backend** (`port 8081`): The authoritative layer for academic hierarchy, attendance sessions, student duplicate locks, security RBAC, and attendance database persistence.
- **Python AI Service** (`port 8000`): The biometric processing engine. It performs image decoding, face detection, FaceNet512 512-dimensional embedding generation, vector comparison, and multi-frame quorum aggregation. It returns **evidence only** and never writes attendance directly.

## Directory Structure
```
python-ai/
    app/
        main.py              # FastAPI endpoints (/health, /recognize, /enroll, /compare)
    models/
        schemas.py           # Pydantic request & response models
    services/
        face_engine.py       # Core DeepFace + FaceNet512 inference & cosine matching
    utils/
        image_utils.py       # Base64 decoding, dimension & quality validation
    data/
        templates.json       # Persisted canonical 512-d biometric templates
    tests/                   # Unit and integration test suites
    requirements.txt         # Pinned Python dependencies
    run.py                   # Service runner (uvicorn on port 8000)
    test_recognition.py      # CLI recognition verification tool
    test_enrollment.py       # CLI enrollment tool
    evaluate_accuracy.py     # Cross-validation & benchmark tool
```

## Running the Service
```bash
# In python-ai directory:
.\.venv\Scripts\python.exe run.py
```

## CLI Verification
```bash
# Test recognition on a single image:
.\.venv\Scripts\python.exe test_recognition.py --image path/to/image.jpg

# Enroll a student with real images:
.\.venv\Scripts\python.exe test_enrollment.py --student STU104101 --name "Alice Smith" --images path/to/folder

# Evaluate dataset accuracy:
.\.venv\Scripts\python.exe evaluate_accuracy.py --dataset test-data
```
