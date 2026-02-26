from fastapi import FastAPI

app = FastAPI(
    title="CV Service",
    description="Computer Vision pipeline for dermatology image analysis",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CV Service"}