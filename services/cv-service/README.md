# CV Service — Computer Vision Pipeline

Dermatology image analysis service using deep learning for lesion classification and detection.

## Stack

- **Framework:** FastAPI
- **Classification:** PyTorch, ResNet18 (transfer learning)
- **Detection:** YOLOv8
- **Preprocessing:** OpenCV, Pillow
- **Experiment Tracking:** MLflow
- **Storage:** AWS S3
- **Dashboard:** Streamlit

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| /health | GET | Service health check |
| /predict | POST | CNN classification |
| /detect | POST | YOLO object detection |
| /analyze | POST | Full pipeline — preprocess + classify + detect + S3 |
| /labels | GET | Available diagnosis labels |
| /images | GET | List images stored in S3 |

## Pipeline
```
Image Upload → Preprocessing (OpenCV) → CNN Classification (ResNet18) → YOLO Detection → AWS S3 Storage → Result
```

## Model

- **Architecture:** ResNet18 with transfer learning (ImageNet weights)
- **Dataset:** HAM10000 — 700 samples (100 per class)
- **Classes:** 7 dermatology diagnoses
- **Training:** 5 epochs, Adam optimizer, lr=0.001
- **Device:** CPU

## Diagnosis Classes

| Class | Severity |
|---|---|
| Melanoma | 5 |
| Basal Cell Carcinoma | 3 |
| Actinic Keratosis | 3 |
| Vascular Lesion | 2 |
| Melanocytic Nevi | 1 |
| Benign Keratosis | 1 |
| Dermatofibroma | 1 |

## Quick Start
```bash
docker-compose up --build
```

- CV Service: http://localhost:8001
- CV Dashboard: http://localhost:8502
- API Docs: http://localhost:8001/docs