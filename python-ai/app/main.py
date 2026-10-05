import time
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models.schemas import (
    HealthResponse,
    EnrollmentRequest,
    EnrollmentResponse,
    RecognizeRequest,
    RecognizeResponse,
    FaceMatch,
    MultiFrameRecognizeRequest,
    MultiFrameRecognizeResponse,
    VectorCompareRequest,
    VectorCompareResponse
)
from services.face_engine import FaceEngine
from utils.image_utils import decode_image_from_base64, validate_image_dimensions

logger = logging.getLogger("fras_api")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="FRAS V2 FaceNet512 Biometric Service",
    description="Dedicated DeepFace + FaceNet512 Biometric AI Microservice for FRAS V2",
    version="2.0.0"
)

# Enable CORS for React frontend and Spring Boot backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = FaceEngine.get_instance()

@app.on_event("startup")
async def startup_event():
    logger.info("FRAS V2 AI Service starting up. Preloading FaceNet512 model...")
    try:
        engine.preload_model()
    except Exception as e:
        logger.warning("Model preload failed on startup (will retry on first request): %s", e)

@app.get("/health", response_model=HealthResponse)
@app.get("/api/face/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="UP",
        service="FRAS-V2-FaceNet512-AI",
        model_name=engine.model_name,
        embedding_dimension=512,
        detector_backend=engine.detector_backend,
        model_loaded=engine.model_loaded,
        liveness_supported=False,
        anti_spoofing_supported=False
    )

@app.get("/api/face/busy")
async def is_busy():
    return {"busy": False}

@app.get("/api/face/status/{student_id}")
async def face_status(student_id: str):
    profile = engine.enrolled_cache.get(student_id)
    if profile:
        return {
            "success": True,
            "student_id": student_id,
            "face_registered": True,
            "sample_count": profile.get("sample_count", 1),
            "in_trained_model": True,
            "model_exists": True,
            "model_version": profile.get("model_version", "Facenet512")
        }
    return {
        "success": True,
        "student_id": student_id,
        "face_registered": False,
        "sample_count": 0,
        "in_trained_model": False,
        "model_exists": False
    }

@app.post("/recognize")
@app.post("/api/face/recognize")
async def recognize(request: Request):
    """
    Unified recognition endpoint supporting:
    1. Direct image frame from React / Teacher camera: { "imageData": "data:image/jpeg;base64,..." }
    2. Spring FaceRecognitionService payload: { "studentId": "...", "modelVersion": "FaceNet512", "embeddingData": "..." }
    """
    start_time = time.time()
    try:
        body_bytes = await request.body()
        data = json.loads(body_bytes.decode("utf-8"))
    except Exception as ex:
        logger.error("JSON decode error in /recognize: %s", ex)
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": f"INVALID_JSON: {str(ex)}", "model_loaded": engine.model_loaded, "faces_detected": 0, "matches": []}
        )

    # Branch 1: Java Spring FaceRecognitionService payload with embeddingData
    if "embeddingData" in data and ("imageData" not in data and "image" not in data):
        student_id = data.get("studentId")
        embedding_text = data.get("embeddingData", "")
        # Parse vector from embeddingData
        try:
            vector = None
            if isinstance(embedding_text, list):
                vector = embedding_text
            elif isinstance(embedding_text, str) and embedding_text.strip().startswith("["):
                vector = json.loads(embedding_text)
            
            if vector and len(vector) == 512:
                # Compare against student's enrolled template if present
                enrolled = engine.enrolled_cache.get(student_id)
                if enrolled and "embedding" in enrolled:
                    dist = engine.calculate_cosine_distance(vector, enrolled["embedding"])
                    matched = dist <= 0.40
                    conf = max(0.0, min(100.0, (1.0 - (dist / 2.0)) * 100.0))
                    return {
                        "successful": matched,
                        "confidenceScore": round(conf, 2),
                        "distance": round(dist, 4),
                        "message": "Recognition verified via FaceNet512" if matched else "Face mismatch",
                        "modelVersion": "FaceNet512"
                    }
                else:
                    return {
                        "successful": False,
                        "confidenceScore": 0.0,
                        "message": f"Student {student_id} has no enrolled biometric template in AI service",
                        "modelVersion": "FaceNet512"
                    }
            else:
                return {
                    "successful": False,
                    "confidenceScore": 0.0,
                    "message": "Invalid embedding vector format or dimensionality",
                    "modelVersion": "FaceNet512"
                }
        except Exception as ex:
            return {
                "successful": False,
                "confidenceScore": 0.0,
                "message": f"Embedding verification error: {str(ex)}",
                "modelVersion": "FaceNet512"
            }

    # Branch 2: Real camera frame recognition (imageData or image field)
    raw_img_data = data.get("imageData") or data.get("image")
    if not raw_img_data:
        return {
            "success": False,
            "model_loaded": engine.model_loaded,
            "faces_detected": 0,
            "matches": [],
            "error": "No image data provided"
        }

    img_bgr = decode_image_from_base64(raw_img_data)
    is_valid, validation_msg = validate_image_dimensions(img_bgr)
    if not is_valid:
        elapsed = (time.time() - start_time) * 1000
        return {
            "success": False,
            "model_loaded": engine.model_loaded,
            "faces_detected": 0,
            "matches": [],
            "error": f"INVALID_IMAGE: {validation_msg}",
            "processing_time_ms": round(elapsed, 2)
        }

    # Extract embedding
    threshold = float(data.get("threshold", 0.40))
    embedding, box, status = engine.generate_embedding(img_bgr)
    elapsed = (time.time() - start_time) * 1000

    if status == "NO_FACE":
        return {
            "success": True,
            "model_loaded": engine.model_loaded,
            "faces_detected": 0,
            "matches": [],
            "error": "NO_FACE",
            "processing_time_ms": round(elapsed, 2)
        }

    if status == "MULTIPLE_FACES":
        return {
            "success": False,
            "model_loaded": engine.model_loaded,
            "faces_detected": 2,
            "matches": [],
            "error": "MULTIPLE_FACES",
            "processing_time_ms": round(elapsed, 2)
        }

    if not embedding:
        return {
            "success": False,
            "model_loaded": engine.model_loaded,
            "faces_detected": 1,
            "matches": [],
            "error": f"EMBEDDING_FAILED: {status}",
            "processing_time_ms": round(elapsed, 2)
        }

    # Match against enrolled candidates
    candidates = data.get("enrolled_faces")
    matched_id, matched_name, dist, confidence, match_status = engine.match_face(
        embedding, candidates=candidates, threshold=threshold
    )

    is_recognized = (match_status == "MATCH" and matched_id is not None)
    matches_list = []
    if is_recognized:
        matches_list.append({
            "recognized": True,
            "student_id": matched_id,
            "name": matched_name or matched_id,
            "confidence": confidence,
            "distance": round(dist, 4),
            "threshold": threshold,
            "status": "MATCH",
            "box": box or [0, 0, 0, 0]
        })
    else:
        matches_list.append({
            "recognized": False,
            "student_id": None,
            "name": "Unknown",
            "confidence": 0.0,
            "distance": round(dist, 4) if dist < 900 else 1.0,
            "threshold": threshold,
            "status": "NO_MATCH",
            "box": box or [0, 0, 0, 0]
        })

    return {
        "success": True,
        "model_loaded": engine.model_loaded,
        "faces_detected": 1,
        "matches": matches_list,
        "error": None,
        "processing_time_ms": round(elapsed, 2)
    }

@app.post("/enroll", response_model=EnrollmentResponse)
@app.post("/api/face/enroll", response_model=EnrollmentResponse)
async def enroll(request: EnrollmentRequest):
    """
    Enrolls a student using real multi-frame / multi-angle images (Front, Left, Right).
    """
    frames_to_process = []
    angles_detected = []

    if request.poses:
        if request.poses.front:
            frames_to_process.extend(request.poses.front)
            angles_detected.append("FRONT")
        if request.poses.left:
            frames_to_process.extend(request.poses.left)
            angles_detected.append("LEFT")
        if request.poses.right:
            frames_to_process.extend(request.poses.right)
            angles_detected.append("RIGHT")
    elif request.images:
        frames_to_process = request.images

    if not frames_to_process:
        return EnrollmentResponse(
            success=False,
            student_id=request.student_id,
            name=request.name,
            usable_frames=0,
            total_frames=0,
            message="No image frames provided for enrollment"
        )

    valid_embeddings = []
    for idx, f_str in enumerate(frames_to_process):
        img_bgr = decode_image_from_base64(f_str)
        if img_bgr is None:
            continue
        valid, _ = validate_image_dimensions(img_bgr)
        if not valid:
            continue
        vec, _, status = engine.generate_embedding(img_bgr)
        if vec and status == "SUCCESS" and len(vec) == 512:
            valid_embeddings.append(vec)

    if len(valid_embeddings) < request.min_usable_frames:
        return EnrollmentResponse(
            success=False,
            student_id=request.student_id,
            name=request.name,
            usable_frames=len(valid_embeddings),
            total_frames=len(frames_to_process),
            message=f"Enrollment rejected: only {len(valid_embeddings)} usable frames detected (minimum {request.min_usable_frames} required)."
        )

    # Compute canonical aggregate template
    profile = engine.enroll_student(
        request.student_id,
        request.name,
        valid_embeddings,
        persist=request.persist_template,
    )
    template_vec = profile["embedding"]

    return EnrollmentResponse(
        success=True,
        student_id=request.student_id,
        name=request.name,
        model_version="FaceNet512",
        embedding_dimensions=512,
        embedding=template_vec,
        embedding_json=json.dumps(template_vec),
        usable_frames=len(valid_embeddings),
        total_frames=len(frames_to_process),
        angles_covered=angles_detected,
        message=f"Successfully enrolled student {request.student_id} using {len(valid_embeddings)} valid frames."
    )

@app.post("/recognize-multi-frame", response_model=MultiFrameRecognizeResponse)
@app.post("/api/face/recognize-multi-frame", response_model=MultiFrameRecognizeResponse)
async def recognize_multi_frame(request: MultiFrameRecognizeRequest):
    """
    Multi-frame quorum recognition. Requires agreement across multiple frames.
    """
    start_time = time.time()
    votes: Dict[str, int] = {}
    distances: Dict[str, List[float]] = {}
    usable_count = 0

    candidates = [{"student_id": c.student_id, "name": c.name, "embedding": c.embedding} for c in request.enrolled_faces]

    for frame_b64 in request.frames:
        img_bgr = decode_image_from_base64(frame_b64)
        if img_bgr is None:
            continue
        vec, _, status = engine.generate_embedding(img_bgr)
        if not vec:
            continue
        usable_count += 1
        m_id, m_name, dist, conf, m_status = engine.match_face(vec, candidates=candidates, threshold=request.threshold or 0.40)
        if m_status == "MATCH" and m_id:
            votes[m_id] = votes.get(m_id, 0) + 1
            if m_id not in distances:
                distances[m_id] = []
            distances[m_id].append(dist)

    elapsed = (time.time() - start_time) * 1000

    # Quorum check
    for sid, vote_count in votes.items():
        if vote_count >= request.quorum:
            avg_d = sum(distances[sid]) / len(distances[sid])
            conf = max(0.0, min(100.0, (1.0 - (avg_d / 2.0)) * 100.0))
            return MultiFrameRecognizeResponse(
                success=True,
                recognized_student_id=sid,
                confidence=round(conf, 2),
                average_distance=round(avg_d, 4),
                total_frames=len(request.frames),
                usable_frames=usable_count,
                votes=votes,
                agreed_frames=vote_count,
                decision="RECOGNIZED",
                processing_time_ms=round(elapsed, 2),
                message=f"Verified student {sid} across {vote_count}/{len(request.frames)} frames (quorum={request.quorum})"
            )

    return MultiFrameRecognizeResponse(
        success=False,
        recognized_student_id=None,
        confidence=0.0,
        average_distance=0.0,
        total_frames=len(request.frames),
        usable_frames=usable_count,
        votes=votes,
        agreed_frames=max(votes.values()) if votes else 0,
        decision="NO_QUORUM",
        processing_time_ms=round(elapsed, 2),
        message=f"No student reached the required quorum of {request.quorum} frames"
    )

@app.post("/compare", response_model=VectorCompareResponse)
@app.post("/api/face/compare", response_model=VectorCompareResponse)
async def compare_vectors(request: VectorCompareRequest):
    """
    Directly compares two 512-dimensional vectors using cosine distance.
    """
    if len(request.embedding1) != 512 or len(request.embedding2) != 512:
        raise HTTPException(status_code=400, detail="Vectors must both have dimension 512")
    
    dist = engine.calculate_cosine_distance(request.embedding1, request.embedding2)
    threshold = request.threshold or 0.40
    similarity = max(0.0, 1.0 - dist)
    return VectorCompareResponse(
        distance=round(dist, 4),
        similarity=round(similarity, 4),
        threshold=threshold,
        matched=(dist <= threshold),
        metric=request.metric or "cosine"
    )
