import argparse
import os
import sys
import time
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.face_engine import FaceEngine
from utils.image_utils import read_image_from_file

def evaluate_dataset(dataset_dir: str, threshold: float = 0.40):
    dataset_dir = os.path.abspath(dataset_dir)
    if not os.path.isdir(dataset_dir):
        print(f"Dataset directory not found: {dataset_dir}")
        print("Accuracy not yet measurable — insufficient real test images.")
        return

    student_dirs = [d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))]
    if len(student_dirs) < 2:
        print("Accuracy not yet measurable — insufficient real test images.")
        print(f"Found {len(student_dirs)} student directory in {dataset_dir}. Minimum 2 students required for cross-validation.")
        return

    engine = FaceEngine.get_instance()
    print("==================================================")
    print("FRAS V2 FaceNet512 Biometric Accuracy Evaluation")
    print(f"Dataset: {dataset_dir}")
    print(f"Configured Threshold: {threshold}")
    print("==================================================")

    # 1. Enroll students using first available front images
    enrollment_cache = {}
    test_samples = [] # (student_id, angle, image_path)

    for student_id in student_dirs:
        s_path = os.path.join(dataset_dir, student_id)
        # Search for angle subdirectories or direct images
        enrolled_embeddings = []
        
        # Check angle dirs: front, left, right
        for angle in ["front", "left", "right"]:
            angle_path = os.path.join(s_path, angle)
            if os.path.isdir(angle_path):
                imgs = [os.path.join(angle_path, f) for f in os.listdir(angle_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if imgs:
                    # Use the first 1-2 for enrollment, rest for testing
                    for i, img_p in enumerate(imgs):
                        if i == 0 and len(enrolled_embeddings) < 2:
                            im = read_image_from_file(img_p)
                            if im is not None:
                                vec, _, st = engine.generate_embedding(im)
                                if vec and st == "SUCCESS":
                                    enrolled_embeddings.append(vec)
                        else:
                            test_samples.append((student_id, angle, img_p))

        # Direct files if no angle subdirs
        direct_imgs = [os.path.join(s_path, f) for f in os.listdir(s_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        for i, img_p in enumerate(direct_imgs):
            if i == 0 and len(enrolled_embeddings) == 0:
                im = read_image_from_file(img_p)
                if im is not None:
                    vec, _, st = engine.generate_embedding(im)
                    if vec and st == "SUCCESS":
                        enrolled_embeddings.append(vec)
            else:
                test_samples.append((student_id, "front", img_p))

        if enrolled_embeddings:
            profile = engine.enroll_student(student_id, student_id, enrolled_embeddings)
            enrollment_cache[student_id] = profile

    if not test_samples:
        print("Accuracy not yet measurable — insufficient real test images.")
        print("Students enrolled, but no remaining distinct test samples found.")
        return

    print(f"Enrolled students: {len(enrollment_cache)}")
    print(f"Total test images: {len(test_samples)}")
    print("Running evaluation...")

    total_images = len(test_samples)
    successful_detections = 0
    failed_detections = 0
    successful_embeddings = 0
    correct_matches = 0
    incorrect_matches = 0
    false_acceptance = 0
    false_rejection = 0
    processing_times = []

    angle_counts = {"front": 0, "left": 0, "right": 0}
    angle_correct = {"front": 0, "left": 0, "right": 0}

    for ground_truth_id, angle, img_p in test_samples:
        t0 = time.time()
        im = read_image_from_file(img_p)
        if im is None:
            failed_detections += 1
            continue

        f_count, _, d_status = engine.detect_and_extract_faces(im)
        if d_status != "SINGLE_FACE":
            failed_detections += 1
            continue
        successful_detections += 1

        vec, _, e_status = engine.generate_embedding(im)
        if not vec:
            continue
        successful_embeddings += 1

        m_id, m_name, dist, conf, m_status = engine.match_face(vec, threshold=threshold)
        elapsed = (time.time() - t0) * 1000
        processing_times.append(elapsed)

        angle_key = angle.lower() if angle.lower() in angle_counts else "front"
        angle_counts[angle_key] = angle_counts.get(angle_key, 0) + 1

        if m_status == "MATCH":
            if m_id == ground_truth_id:
                correct_matches += 1
                angle_correct[angle_key] = angle_correct.get(angle_key, 0) + 1
            else:
                # Matched wrong person
                incorrect_matches += 1
                false_acceptance += 1
        else:
            # Should have matched, but returned NO_MATCH
            false_rejection += 1

    accuracy = (correct_matches / total_images) * 100.0 if total_images > 0 else 0.0
    avg_time = np.mean(processing_times) if processing_times else 0.0
    med_time = np.median(processing_times) if processing_times else 0.0

    print("\n---------------- Evaluation Results ----------------")
    print(f"Total images evaluated: {total_images}")
    print(f"Successful face detections: {successful_detections}")
    print(f"Failed face detections: {failed_detections}")
    print(f"Successful embedding generations: {successful_embeddings}")
    print(f"Correct matches: {correct_matches}")
    print(f"Incorrect matches: {incorrect_matches}")
    print(f"False Acceptance Rate (FAR): {false_acceptance}/{total_images} ({(false_acceptance/total_images)*100:.2f}%)")
    print(f"False Rejection Rate (FRR): {false_rejection}/{total_images} ({(false_rejection/total_images)*100:.2f}%)")
    print(f"Recognition Accuracy: {accuracy:.2f}%")
    print(f"Average processing time: {avg_time:.2f} ms")
    print(f"Median processing time: {med_time:.2f} ms")

    for ang in ["front", "left", "right"]:
        cnt = angle_counts.get(ang, 0)
        corr = angle_correct.get(ang, 0)
        ang_acc = (corr / cnt * 100.0) if cnt > 0 else 0.0
        print(f"{ang.capitalize()}-angle accuracy: {ang_acc:.2f}% ({corr}/{cnt})")

def main():
    parser = argparse.ArgumentParser(description="Evaluate accuracy of FaceNet512 model on real test dataset")
    parser.add_argument("--dataset", default="test-data", help="Directory containing test dataset")
    parser.add_argument("--threshold", type=float, default=0.40, help="Cosine distance threshold")
    args = parser.parse_args()

    evaluate_dataset(args.dataset, args.threshold)

if __name__ == "__main__":
    main()
