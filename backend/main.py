from fastapi import FastAPI
from routers import patients, clinical

app = FastAPI(
    title="Medical AI Platform",
    description="Clinical AI Platform — ML, Computer Vision, HL7/FHIR. ⚠️ DISCLAIMER: This is a technical portfolio demonstration only. NOT a certified medical device. Not for clinical use.",
    version="0.1.0"
)

app.include_router(patients.router, prefix="/api/v1")
app.include_router(clinical.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Medical AI Platform"}