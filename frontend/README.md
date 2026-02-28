# Frontend — React Dashboard

Single-page application integrating all Medical AI Platform services into a unified clinical dashboard.

## Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **HTTP:** Axios
- **Routing:** React Router v6
- **Server:** nginx (production)

## Pages

| Page | Route | Description |
|---|---|---|
| Overview | / | System status, KPIs, service health |
| Patients | /patients | Patient registry with search and clinical detail |
| ML Models | /ml | Model performance, diagnosis distribution, prediction simulator |
| Computer Vision | /cv | Image upload, ResNet18 classification, YOLO detection |
| HL7 / FHIR | /hl7 | Message feed, HL7 parser, FHIR R4 converter |

## Services Connected

| Service | URL |
|---|---|
| Backend API | http://localhost:8000 |
| CV Service | http://localhost:8001 |
| HL7 Service | http://localhost:8002 |

## Quick Start
```bash
# Development
npm install
npm run dev

# Production (Docker)
docker-compose up --build frontend
```

- Development: http://localhost:5173
- Production: http://localhost:3000