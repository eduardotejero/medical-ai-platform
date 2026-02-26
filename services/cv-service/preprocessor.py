import cv2
import numpy as np
from PIL import Image, ImageEnhance
import io

TARGET_SIZE = (224, 224)

def load_image(file_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    return img

def resize(img: np.ndarray) -> np.ndarray:
    return cv2.resize(img, TARGET_SIZE)

def normalize(img: np.ndarray) -> np.ndarray:
    return img.astype(np.float32) / 255.0

def remove_hair(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    _, mask = cv2.threshold(blackhat, 10, 255, cv2.THRESH_BINARY)
    return cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)

def enhance(img_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img = ImageEnhance.Contrast(img).enhance(1.2)
    img = ImageEnhance.Sharpness(img).enhance(1.1)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def preprocess(file_bytes: bytes) -> np.ndarray:
    img = load_image(file_bytes)
    img = remove_hair(img)
    img = resize(img)
    img = normalize(img)
    return img

def get_stats(img: np.ndarray) -> dict:
    return {
        "mean_r": float(np.mean(img[:, :, 2])),
        "mean_g": float(np.mean(img[:, :, 1])),
        "mean_b": float(np.mean(img[:, :, 0])),
        "std_r": float(np.std(img[:, :, 2])),
        "std_g": float(np.std(img[:, :, 1])),
        "std_b": float(np.std(img[:, :, 0])),
        "contrast": float(np.std(cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)))
    }