# Medical AI Platform
> ⚠️ **DISCLAIMER:** This platform is a technical portfolio demonstration only. It is NOT a certified medical device and must NOT be used for clinical diagnosis or medical decision-making. Results are for demonstration purposes only.

Clinical AI Platform integrating Machine Learning, Computer Vision, HL7/FHIR, and Hospital System Integration.

## Overview

End-to-end medical data platform built to demonstrate production-grade Python development for MedTech applications. Includes statistical analysis, ML model training with experiment tracking, REST API, interactive dashboards, and computer vision pipeline for dermatology image analysis.

## Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, Redis
- **ML:** Scikit-learn, MLflow
- **Computer Vision:** PyTorch, ResNet18, YOLOv8, OpenCV
- **Dashboard:** Streamlit, Plotly
- **Storage:** AWS S3
- **Infrastructure:** Docker, docker-compose

## Services

| Service | URL | Description |
|---|---|---|
| FastAPI | http://localhost:8000 | REST API |
| FastAPI Docs | http://localhost:8000/docs | Auto-generated API docs |
| Streamlit | http://localhost:8501 | Clinical dashboard |
| MLflow | http://localhost:5000 | Experiment tracking |
| CV Service | http://localhost:8001 | Computer Vision API |
| CV Service Docs | http://localhost:8001/docs | CV API docs |
| CV Dashboard | http://localhost:8502 | Computer Vision dashboard |
| PostgreSQL | localhost:5432 | Database |
| HL7 Service | http://localhost:8002 | HL7/FHIR integration API |
| HL7 Service Docs | http://localhost:8002/docs | HL7 API docs |
| HL7 Dashboard | http://localhost:8503 | HL7/FHIR dashboard |
| MIRTH Connect | https://localhost:8443 | HL7 integration engine |
| React Frontend (dev) | http://localhost:5173 | React dashboard |
| React Frontend (prod) | http://localhost:3000 | React dashboard (nginx) |

## Dataset

HAM10000 — 10,015 dermatology cases across 7 diagnosis categories.

| Diagnosis | Count | Severity |
|---|---|---|
| Melanocytic Nevi | 6,705 | 1 |
| Melanoma | 1,113 | 5 |
| Benign Keratosis | 1,099 | 1 |
| Basal Cell Carcinoma | 514 | 3 |
| Actinic Keratosis | 327 | 3 |
| Vascular Lesion | 142 | 2 |
| Dermatofibroma | 115 | 1 |

## ML Results

Models trained: Logistic Regression, Random Forest, Gradient Boosting

| Model | Accuracy | CV Mean |
|---|---|---|
| Logistic Regression | 0.8462 | 0.8461 |
| Random Forest | 0.8462 | 0.8461 |
| Gradient Boosting | 0.8462 | 0.8461 |

Experiments tracked with MLflow. Models stored in AWS S3.

## Computer Vision

- **Architecture:** ResNet18 with transfer learning (ImageNet weights)
- **Dataset:** HAM10000 — 700 samples (100 per class)
- **Detection:** YOLOv8n
- **Training:** 5 epochs, Adam optimizer, lr=0.001

## Quick Start
```bash
git clone https://github.com/TU_USERNAME/medical-ai-platform.git
cd medical-ai-platform
cp .env.example .env
docker-compose up --build
```

## Project Structure
```
medical-ai-platform/
├── backend/
│   ├── main.py               # FastAPI application
│   ├── database.py           # SQLAlchemy connection
│   ├── models.py             # ORM models
│   ├── schemas.py            # Pydantic schemas
│   ├── routers/              # API endpoints
│   ├── dashboard.py          # Streamlit dashboard
│   ├── train_model.py        # ML training
│   ├── mlflow_tracking.py    # Experiment tracking
│   ├── aws_storage.py        # AWS S3 integration
│   └── load_dataset.py       # HAM10000 data loader
├── services/
│   └── cv-service/
│       ├── main.py           # CV FastAPI application
│       ├── classifier.py     # ResNet18 CNN classifier
│       ├── detector.py       # YOLOv8 detector
│       ├── preprocessor.py   # OpenCV preprocessing
│       ├── dashboard.py      # Streamlit CV dashboard
│       ├── train_cnn.py      # CNN training
│       └── aws_storage.py    # S3 image storage
├── database/
│   ├── schema.sql            # PostgreSQL schema
│   └── init.sql              # Seed data
└── docker-compose.yml
```

## Methodology

- Agile/Scrum with Jira
- Git flow with ticket references (MAP-X)
- Containerized with Docker
- Cloud storage with AWS S3