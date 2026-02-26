import numpy as np
from PIL import Image
import io
from ultralytics import YOLO

MODEL_NAME = "yolov8n.pt"

def load_model() -> YOLO:
    return YOLO(MODEL_NAME)

def detect(model: YOLO, file_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img_np = np.array(img)
    
    results = model(img_np, verbose=False)
    result = results[0]
    
    detections = []
    for box in result.boxes:
        detections.append({
            "class": result.names[int(box.cls)],
            "confidence": float(box.conf),
            "bbox": box.xyxy[0].tolist()
        })
    
    return {
        "detections": detections,
        "total": len(detections),
        "image_size": {"width": img.width, "height": img.height}
    }