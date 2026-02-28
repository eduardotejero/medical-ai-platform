from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Patient, Diagnosis

router = APIRouter()

@router.get("/statistics")
def get_statistics(db: Session = Depends(get_db)):
    total_patients = db.query(Patient).count()
    
    diagnosis_dist = db.query(
        Diagnosis.diagnosis,
        func.count(Diagnosis.id).label("count")
    ).group_by(Diagnosis.diagnosis).all()

    severity_dist = db.query(
        Diagnosis.severity,
        func.count(Diagnosis.id).label("count")
    ).group_by(Diagnosis.severity).all()

    return {
        "total_patients": total_patients,
        "diagnosis_distribution": {d: c for d, c in diagnosis_dist if d},
        "severity_distribution": {str(s): c for s, c in severity_dist if s is not None},
    }