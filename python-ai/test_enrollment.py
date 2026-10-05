import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.face_engine import FaceEngine
from utils.image_utils import read_image_from_file

def main():
    parser = argparse.ArgumentParser(description="FRAS V2 FaceNet512 Biometric Enrollment CLI")
    parser.add_argument("--student", required=True, help="Student ID (e.g. STU104101)")
    parser.add_argument("--name", default=None, help="Student full name")
    parser.add_argument("--images", required=True, help="Directory containing enrollment images (or subdirs front/left/right)")
    parser.add_argument("--min-frames", type=int, default=1, help="Minimum usable frames required")
    args = parser.parse_args()

    images_dir = os.path.abspath(args.images)
    if not os.path.isdir(images_dir):
        print(f"Error: Directory not found at {images_dir}")
        sys.exit(1)

    image_files = []
    for root, _, files in os.walk(images_dir):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]:
                image_files.append(os.path.join(root, f))

    if not image_files:
        print(f"Error: No image files found in {images_dir}")
        sys.exit(1)

    print(f"Enrolling student: {args.student} ({args.name or args.student})")
    print(f"Found {len(image_files)} image files. Processing...")

    engine = FaceEngine.get_instance()
    valid_embeddings = []
    processed_count = 0

    start_time = time.time()
    for img_path in image_files:
        processed_count += 1
        img = read_image_from_file(img_path)
        if img is None:
            print(f"  [Frame {processed_count}] {os.path.basename(img_path)}: Failed to read image")
            continue

        face_count, _, detect_status = engine.detect_and_extract_faces(img)
        if detect_status != "SINGLE_FACE":
            print(f"  [Frame {processed_count}] {os.path.basename(img_path)}: Rejected ({detect_status}, {face_count} faces)")
            continue

        vec, _, emb_status = engine.generate_embedding(img)
        if vec and emb_status == "SUCCESS" and len(vec) == 512:
            valid_embeddings.append(vec)
            print(f"  [Frame {processed_count}] {os.path.basename(img_path)}: FaceNet512 512-d vector extracted OK")
        else:
            print(f"  [Frame {processed_count}] {os.path.basename(img_path)}: Embedding failed ({emb_status})")

    elapsed_ms = (time.time() - start_time) * 1000

    print("--------------------------------------------")
    print(f"Total frames processed: {processed_count}")
    print(f"Usable biometric frames: {len(valid_embeddings)}")
    print(f"Total processing time: {elapsed_ms:.2f} ms")

    if len(valid_embeddings) < args.min_frames:
        print(f"Enrollment FAILED: Insufficient valid frames ({len(valid_embeddings)} < {args.min_frames})")
        sys.exit(1)

    profile = engine.enroll_student(args.student, args.name, valid_embeddings)
    print("Enrollment SUCCESSFUL!")
    print(f"Model version: {profile['model_version']}")
    print(f"Canonical embedding dimension: {len(profile['embedding'])}")
    print(f"Stored in template database: {engine.templates_file}")

if __name__ == "__main__":
    main()
