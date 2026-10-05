import base64
import re
import numpy as np
import cv2
from typing import Tuple, Optional

def decode_image_from_base64(data_uri_or_base64: str) -> Optional[np.ndarray]:
    """
    Decodes a base64 encoded string or Data URL into an OpenCV BGR numpy array.
    """
    if not data_uri_or_base64 or not isinstance(data_uri_or_base64, str):
        return None
    
    # Strip data URI header if present (e.g. data:image/jpeg;base64,...)
    if "," in data_uri_or_base64:
        encoded_data = data_uri_or_base64.split(",", 1)[1]
    else:
        encoded_data = data_uri_or_base64
    
    # Clean whitespace and newlines
    encoded_data = re.sub(r"\s+", "", encoded_data)
    
    try:
        image_bytes = base64.b64decode(encoded_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        return None

def validate_image_dimensions(img: np.ndarray, min_width: int = 64, min_height: int = 64) -> Tuple[bool, str]:
    """
    Validates that the image array is not empty and exceeds minimum dimensions.
    """
    if img is None or not isinstance(img, np.ndarray):
        return False, "Image decoding failed: invalid or corrupt image data"
    
    h, w = img.shape[:2]
    if w < min_width or h < min_height:
        return False, f"Image dimensions too small ({w}x{h}). Minimum required is {min_width}x{min_height}."
    
    return True, "Valid"

def read_image_from_file(file_path: str) -> Optional[np.ndarray]:
    """
    Safely reads an image from filesystem using OpenCV.
    """
    try:
        img = cv2.imread(file_path, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None
