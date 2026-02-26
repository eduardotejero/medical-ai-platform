# Medical AI Platform

Clinical AI Platform integrating Machine Learning, Computer Vision, 
HL7/FHIR, and Hospital System Integration.

## Stack
- **Backend:** Python, FastAPI, PostgreSQL, Redis
- **ML:** Scikit-learn, PyTorch, MLflow, AWS SageMaker
- **Computer Vision:** OpenCV, YOLO
- **Integration:** HL7, FHIR, MIRTH Connect
- **Frontend:** React, Tailwind CSS
- **Infrastructure:** Docker, AWS EC2, ECS, S3, RDS

## Project Structure
```
medical-ai-platform/
├── backend/          # FastAPI REST API
├── frontend/         # React application
├── services/
│   ├── ml-service/   # ML models and training
│   ├── cv-service/   # Computer Vision pipeline
│   └── hl7-service/  # HL7/FHIR integration
├── database/         # PostgreSQL schemas
├── mirth/            # MIRTH Connect config
└── docs/             # Documentation
```

## Getting Started
```bash
docker-compose up
```

## Methodology
- Agile/Scrum with Jira
- Git flow with ticket references