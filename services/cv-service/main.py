from fastapi import FastAPI, UploadFile, File, HTTPException
from classifier import build_model, predict, LABELS
from detector import load_model as load_yolo, detect
from preprocessor import preprocess, get_stats
from aws_storage import upload_image, upload_result
from fastapi.middleware.cors import CORSMiddleware
import torch
import os

app = FastAPI(
    title="CV Service",
    description="Computer Vision pipeline for dermatology image analysis. ⚠️ DISCLAIMER: This is a technical portfolio demonstration only. NOT a certified medical device. Not for clinical use.",
    version="0.1.0"
)

MODEL_PATH = "models/resnet18_dermatology.pth"

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
    return predict(cnn_model, file_bytes)

@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    file_bytes = await file.read()
    return detect(yolo_model, file_bytes)

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    file_bytes = await file.read()

    img = preprocess(file_bytes)
    stats = get_stats(img)
    classification = predict(cnn_model, file_bytes)
    detections = detect(yolo_model, file_bytes)

    result = {
        "classification": classification,
        "detections": detections,
        "image_stats": stats
    }

    # Store image and result in S3
    s3_image_key = upload_image(file_bytes, file.filename)
    s3_result_key = upload_result(result, file.filename)
    result["s3_image"] = s3_image_key
    result["s3_result"] = s3_result_key

    return result

@app.get("/labels")
def get_labels():
    return {"labels": LABELS}

@app.get("/images")
def list_images():
    from aws_storage import list_images
    return {"images": list_images()}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)