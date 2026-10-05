from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class HealthResponse(BaseModel):
    status: str = "UP"
    service: str = "FRAS-V2-FaceNet512-AI"
    model_name: str = "Facenet512"
    embedding_dimension: int = 512
    detector_backend: str = "opencv"
    model_loaded: bool = False
    liveness_supported: bool = False
    anti_spoofing_supported: bool = False

class EnrolledFaceProfile(BaseModel):
    student_id: str
    name: Optional[str] = None
    embedding: List[float]

class PoseFrames(BaseModel):
    front: List[str] = Field(default_factory=list, description="Base64 encoded frames for front angle")
    left: List[str] = Field(default_factory=list, description="Base64 encoded frames for left angle")
    right: List[str] = Field(default_factory=list, description="Base64 encoded frames for right angle")

class EnrollmentRequest(BaseModel):
    student_id: str
    name: Optional[str] = None
    images: Optional[List[str]] = Field(default=None, description="Flat list of base64 frames")
    poses: Optional[PoseFrames] = Field(default=None, description="Structured multi-angle frames")
    min_usable_frames: int = 1
    persist_template: bool = True

class EnrollmentResponse(BaseModel):
    success: bool
    student_id: str
    name: Optional[str] = None
    model_version: str = "FaceNet512"
    embedding_dimensions: int = 512
    embedding: Optional[List[float]] = None
    embedding_json: Optional[str] = None
    usable_frames: int
    total_frames: int
    angles_covered: List[str] = Field(default_factory=list)
    message: str

class FaceBox(BaseModel):
    x: int
    y: int
    w: int
    h: int

class FaceMatch(BaseModel):
    recognized: bool
    student_id: Optional[str] = None
    name: Optional[str] = None
    confidence: float
    distance: float
    threshold: float
    status: str
    box: Optional[List[int]] = None

class RecognizeRequest(BaseModel):
    imageData: Optional[str] = Field(default=None, description="Base64/dataURL frame")
    image: Optional[str] = Field(default=None, description="Alternative field for Base64/dataURL")
    fileName: Optional[str] = None
    studentId: Optional[str] = None
    enrolled_faces: Optional[List[EnrolledFaceProfile]] = Field(default=None, description="Templates to compare against")
    threshold: Optional[float] = Field(default=0.40, description="Cosine distance threshold")

class RecognizeResponse(BaseModel):
    success: bool
    model_loaded: bool
    faces_detected: int
    matches: List[FaceMatch] = Field(default_factory=list)
    error: Optional[str] = None
    processing_time_ms: float = 0.0

class MultiFrameRecognizeRequest(BaseModel):
    frames: List[str] = Field(min_length=3, max_length=5)
    enrolled_faces: List[EnrolledFaceProfile] = Field(min_length=1)
    quorum: int = Field(default=3, ge=1, le=5)
    threshold: Optional[float] = 0.40

class MultiFrameRecognizeResponse(BaseModel):
    success: bool
    recognized_student_id: Optional[str] = None
    student_name: Optional[str] = None
    confidence: float = 0.0
    average_distance: float = 0.0
    total_frames: int
    usable_frames: int
    votes: Dict[str, int] = Field(default_factory=dict)
    agreed_frames: int = 0
    decision: str
    processing_time_ms: float = 0.0
    message: str

class VectorCompareRequest(BaseModel):
    embedding1: List[float]
    embedding2: List[float]
    threshold: Optional[float] = 0.40
    metric: Optional[str] = "cosine"

class VectorCompareResponse(BaseModel):
    distance: float
    similarity: float
    threshold: float
    matched: bool
    metric: str
