# HL7 Service — Hospital Integration Pipeline

HL7 v2 message parsing, FHIR R4 conversion, and serverless processing pipeline for hospital system integration.

## Stack

- **Framework:** FastAPI
- **HL7 Parsing:** python-hl7
- **FHIR Conversion:** fhir.resources
- **Integration:** MIRTH Connect
- **Database:** PostgreSQL via SQLAlchemy
- **Serverless:** AWS Lambda
- **Dashboard:** Streamlit

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| /health | GET | Service health check |
| /messages | POST | Receive and store HL7 message |
| /messages | GET | List stored messages |
| /parse | POST | Parse HL7 v2 message |
| /convert/fhir | POST | Convert HL7 v2 to FHIR R4 Bundle |
| /simulate | POST | Insert sample messages |
| /lambda/process | POST | Process message via AWS Lambda |
| /lambda/create | POST | Create Lambda function |

## Pipeline
```
HL7 v2 Message → MIRTH Connect → FastAPI → Parser → FHIR Converter → PostgreSQL → AWS Lambda
```

## Supported Message Types

| Type | Description |
|---|---|
| ORU^R01 | Observation Result |
| ADT^A01 | Patient Admission |

## FHIR Resources Generated

- Patient
- Observation

## Quick Start
```bash
docker-compose up --build
```

- HL7 Service: http://localhost:8002
- HL7 Dashboard: http://localhost:8503
- API Docs: http://localhost:8002/docs