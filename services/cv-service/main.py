from fastapi import FastAPI, UploadFile, File, HTTPException
from classifier import build_model, predict, LABELS
from detector import load_model as load_yolo, detect
from preprocessor import preprocess, get_stats
import torch
import os

app = FastAPI(
    title="CV Service",
    description="Computer Vision pipeline for dermatology image analysis",
    version="0.1.0"
)

MODEL_PATH = "models/resnet18_dermatology.pth"

# Load models on startup
cnn_model = build_model()
if os.path.exists(MODEL_PATH):
    cnn_model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    print(f"CNN model loaded from {MODEL_PATH}")
else:
    print("WARNING: No trained model found, using random weights")

yolo_model = load_yolo()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CV Service"}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    file_bytes = await file.read()
    result = predict(cnn_model, file_bytes)
    return result

@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    file_bytes = await file.read()
    result = detect(yolo_model, file_bytes)
    return result

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    file_bytes = await file.read()
    img = preprocess(file_bytes)
    stats = get_stats(img)
    classification = predict(cnn_model, file_bytes)
    detections = detect(yolo_model, file_bytes)
    return {
        "classification": classification,
        "detections": detections,
        "image_stats": stats
    }

@app.get("/labels")
def get_labels():
    return {"labels": LABELS}