import sys
import os
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"
try:
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if sys.stderr and hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import json
import time
import logging
import numpy as np
from typing import List, Dict, Optional, Tuple, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("face_engine")

class FaceEngine:
    _instance = None

    def __init__(self, model_name: str = "Facenet512", detector_backend: str = "opencv", use_local_cache: bool = False):
        self.model_name = model_name
        self.detector_backend = detector_backend
        self.model = None
        self.model_loaded = False
        self.use_local_cache = use_local_cache
        self.templates_file = os.path.join(os.path.dirname(__file__), "..", "data", "templates.json")
        self.enrolled_cache: Dict[str, Dict[str, Any]] = {}
        if self.use_local_cache:
            self._load_local_templates()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = FaceEngine()
        return cls._instance

    def preload_model(self):
        """
        Loads the FaceNet512 model into memory using DeepFace.
        """
        if self.model_loaded:
            return True
        try:
            logger.info("Initializing and preloading DeepFace model: %s", self.model_name)
            from deepface import DeepFace
            # Build model directly to trigger weights download/loading if not already cached
            self.model = DeepFace.build_model(model_name=self.model_name)
            self.model_loaded = True
            logger.info("DeepFace model %s loaded successfully.", self.model_name)
            return True
        except Exception as e:
            logger.error("Failed to load FaceNet512 model: %s", e)
            self.model_loaded = False
            return False

    def detect_and_extract_faces(self, img_bgr: np.ndarray) -> Tuple[int, List[Dict[str, Any]], str]:
        """
        Detects faces in the given image.
        Returns:
            face_count: int
            face_objects: list of dicts with 'facial_area' and 'face'
            status: 'NO_FACE', 'SINGLE_FACE', 'MULTIPLE_FACES', or 'DETECTION_ERROR'
        """
        try:
            from deepface import DeepFace
            # extract_faces detects bounding boxes and crops
            face_objs = DeepFace.extract_faces(
                img_path=img_bgr,
                detector_backend=self.detector_backend,
                enforce_detection=False,
                align=True
            )
            
            # Filter out non-confident face detections
            valid_faces = []
            for fo in face_objs:
                confidence = fo.get("confidence", 0.0)
                # DeepFace opencv detector confidence is typically 0 to 1
                if confidence > 0.40 or len(face_objs) == 1:
                    # Also check minimum facial area size
                    area = fo.get("facial_area", {})
                    w = area.get("w", 0)
                    h = area.get("h", 0)
                    if w >= 20 and h >= 20:
                        valid_faces.append(fo)

            count = len(valid_faces)
            if count == 0:
                return 0, [], "NO_FACE"
            elif count == 1:
                return 1, valid_faces, "SINGLE_FACE"
            else:
                return count, valid_faces, "MULTIPLE_FACES"

        except Exception as ex:
            logger.warning("Face detection exception: %s", ex)
            return 0, [], "DETECTION_ERROR"

    def generate_embedding(self, img_bgr: np.ndarray, enforce_detection: bool = False) -> Tuple[Optional[List[float]], Optional[List[int]], str]:
        """
        Generates a 512-dimensional FaceNet512 embedding from an OpenCV BGR image.
        Returns:
            embedding: 512-d list of floats (L2 normalized) or None
            facial_area: [x, y, w, h] or None
            status_message: status description
        """
        from deepface import DeepFace
        try:
            # Check face count first for multiple-face safety
            face_count, faces, detection_status = self.detect_and_extract_faces(img_bgr)
            if detection_status == "NO_FACE":
                return None, None, "NO_FACE"
            if detection_status == "MULTIPLE_FACES":
                return None, None, "MULTIPLE_FACES"

            # Represent the face using Facenet512
            embeddings = DeepFace.represent(
                img_path=img_bgr,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=enforce_detection,
                align=True
            )

            if not embeddings or len(embeddings) == 0:
                return None, None, "EMBEDDING_FAILED"

            target_repr = embeddings[0]
            raw_vector = target_repr.get("embedding", [])
            area = target_repr.get("facial_area", {})
            box = [area.get("x", 0), area.get("y", 0), area.get("w", 0), area.get("h", 0)]

            # Validate dimensionality
            if len(raw_vector) != 512:
                logger.error("Generated vector dimension is %d, expected 512 for %s", len(raw_vector), self.model_name)
                return None, None, f"DIMENSION_MISMATCH: expected 512 got {len(raw_vector)}"

            # L2 Normalize
            vec_np = np.array(raw_vector, dtype=np.float64)
            norm = np.linalg.norm(vec_np)
            if norm > 0:
                normalized_vec = (vec_np / norm).tolist()
            else:
                normalized_vec = vec_np.tolist()

            return normalized_vec, box, "SUCCESS"

        except Exception as e:
            logger.error("Embedding generation error: %s", e)
            return None, None, f"ERROR: {str(e)}"

    def calculate_cosine_distance(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculates cosine distance between two 512-d vectors.
        Distance = 1.0 - (u . v) / (||u|| * ||v||)
        Range: 0.0 (identical) to 2.0 (opposite).
        """
        u = np.array(embedding1, dtype=np.float64)
        v = np.array(embedding2, dtype=np.float64)
        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)
        if norm_u == 0.0 or norm_v == 0.0:
            return 1.0
        similarity = np.dot(u, v) / (norm_u * norm_v)
        # Numerical clamp
        similarity = max(-1.0, min(1.0, float(similarity)))
        distance = 1.0 - similarity
        return float(distance)

    def enroll_student(self, student_id: str, name: Optional[str], embeddings_list: List[List[float]], persist: bool = True) -> Dict[str, Any]:
        """
        Aggregates multiple face embeddings into a single canonical L2-normalized template
        and saves it in local cache/file.
        """
        if not embeddings_list:
            raise ValueError("No embeddings provided for enrollment")

        arr = np.array(embeddings_list, dtype=np.float64)
        mean_vec = np.mean(arr, axis=0)
        norm = np.linalg.norm(mean_vec)
        if norm > 0:
            canonical_template = (mean_vec / norm).tolist()
        else:
            canonical_template = mean_vec.tolist()

        profile = {
            "student_id": student_id,
            "name": name or student_id,
            "model_version": self.model_name,
            "embedding": canonical_template,
            "sample_count": len(embeddings_list),
            "updated_at": time.time()
        }
        if persist:
            self.enrolled_cache[student_id] = profile
            self._persist_local_templates()
        return profile

    def match_face(self, target_embedding: List[float], candidates: Optional[List[Dict[str, Any]]] = None, threshold: float = 0.40) -> Tuple[Optional[str], Optional[str], float, float, str]:
        """
        Compares target embedding against candidate templates.
        Returns:
            matched_student_id, student_name, best_distance, confidence_score, status
        """
        pool = candidates if candidates is not None else list(self.enrolled_cache.values())
        if not pool:
            return None, None, 1.0, 0.0, "NO_ENROLLED_FACES"

        best_id = None
        best_name = None
        min_dist = 999.0

        for cand in pool:
            sid = cand.get("student_id")
            name = cand.get("name")
            vec = cand.get("embedding")
            if not vec or len(vec) != 512:
                continue
            dist = self.calculate_cosine_distance(target_embedding, vec)
            if dist < min_dist:
                min_dist = dist
                best_id = sid
                best_name = name

        if best_id is not None and min_dist <= threshold:
            # Convert cosine distance to percentage confidence (0 distance -> 100%, threshold distance -> 70%)
            # Linear or clamped confidence mapping:
            confidence = max(0.0, min(100.0, (1.0 - (min_dist / 2.0)) * 100.0))
            return best_id, best_name, min_dist, round(confidence, 2), "MATCH"
        else:
            return None, None, min_dist, 0.0, "NO_MATCH"

    def _persist_local_templates(self):
        try:
            os.makedirs(os.path.dirname(self.templates_file), exist_ok=True)
            with open(self.templates_file, "w", encoding="utf-8") as f:
                json.dump(self.enrolled_cache, f, indent=2)
        except Exception as e:
            logger.error("Failed to persist templates to disk: %s", e)

    def _load_local_templates(self):
        try:
            if os.path.exists(self.templates_file):
                with open(self.templates_file, "r", encoding="utf-8") as f:
                    self.enrolled_cache = json.load(f)
                logger.info("Loaded %d enrolled templates from %s", len(self.enrolled_cache), self.templates_file)
        except Exception as e:
            logger.error("Failed to load templates: %s", e)
