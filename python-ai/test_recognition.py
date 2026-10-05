import argparse
import os
import sys
import time
import json

# Add current dir to path and force UTF-8
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"
try:
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if sys.stderr and hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

from services.face_engine import FaceEngine
from utils.image_utils import read_image_from_file

def main():
    parser = argparse.ArgumentParser(description="FRAS V2 FaceNet512 Biometric Recognition CLI Test")
    parser.add_argument("--image", required=True, help="Path to input face image file")
    parser.add_argument("--threshold", type=float, default=0.40, help="Cosine distance threshold (default: 0.40)")
    parser.add_argument("--templates", help="Optional path to custom templates.json")
    args = parser.parse_args()

    image_path = os.path.abspath(args.image)
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        sys.exit(1)

    engine = FaceEngine.get_instance()
    if args.templates and os.path.exists(args.templates):
        with open(args.templates, "r", encoding="utf-8") as f:
            engine.enrolled_cache = json.load(f)

    start_time = time.time()
    img = read_image_from_file(image_path)
    if img is None:
        print(f"Error: Failed to decode image at {image_path}")
        sys.exit(1)

    face_count, faces, detection_status = engine.detect_and_extract_faces(img)
    face_detected_str = f"Yes ({face_count} face{'s' if face_count > 1 else ''})" if face_count > 0 else "No"

    embedding, box, status = engine.generate_embedding(img)
    emb_generated_str = "Yes" if embedding is not None else f"No ({status})"
    emb_dim_str = str(len(embedding)) if embedding is not None else "N/A"

    best_match_str = "None"
    distance_str = "N/A"
    result_str = "NO_MATCH"

    if embedding is not None:
        matched_id, matched_name, dist, confidence, m_status = engine.match_face(
            embedding, threshold=args.threshold
        )
        if m_status == "MATCH" and matched_id:
            best_match_str = f"{matched_name} ({matched_id})"
            distance_str = f"{dist:.4f} (Confidence: {confidence}%)"
            result_str = "MATCH"
        elif m_status == "NO_ENROLLED_FACES":
            best_match_str = "No enrolled faces in database"
            distance_str = "N/A"
            result_str = "NO_ENROLLED_FACES"
        else:
            best_match_str = f"Unknown (Closest: {matched_name or matched_id or 'None'})"
            distance_str = f"{dist:.4f}" if dist < 900 else "N/A"
            result_str = "NO_MATCH"
    else:
        result_str = f"FAILED ({status})"

    elapsed_ms = (time.time() - start_time) * 1000

    print("FaceNet512 Recognition Test")
    print("---------------------------")
    print(f"Image: {image_path}")
    print(f"Face detected: {face_detected_str}")
    print(f"Embedding generated: {emb_generated_str}")
    print(f"Embedding dimensions: {emb_dim_str}")
    print(f"Best match: {best_match_str}")
    print(f"Distance: {distance_str}")
    print(f"Threshold: {args.threshold}")
    print(f"Processing time: {elapsed_ms:.2f} ms")
    print(f"Result: {result_str}")

if __name__ == "__main__":
    main()
