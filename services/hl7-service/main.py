from fastapi import FastAPI

app = FastAPI(
    title="HL7 Service",
    description="HL7 v2 parsing and FHIR R4 conversion pipeline. Portfolio demonstration only.",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "HL7 Service"}