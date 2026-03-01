from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/clinical", tags=["clinical"])

@router.get("/{patient_id}", response_model=list[schemas.ClinicalDataResponse])
def get_clinical_data(patient_id: int, db: Session = Depends(get_db)):
    data = db.query(models.ClinicalData).filter(models.ClinicalData.patient_id == patient_id).all()
    if not data:
        raise HTTPException(status_code=404, detail="No clinical data found for this patient")
    return data

@router.post("/", response_model=schemas.ClinicalDataResponse)
def create_clinical_data(data: schemas.ClinicalDataBase, db: Session = Depends(get_db)):
    db_data = models.ClinicalData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@router.post("/diagnoses/", response_model=schemas.DiagnosisResponse)
def create_diagnosis(data: schemas.DiagnosisCreate, db: Session = Depends(get_db)):
    db_diag = models.Diagnosis(
        patient_id=data.patient_id,
        diagnosis=data.diagnosis,
        severity=data.severity,
        confidence=data.confidence,
    )
    db.add(db_diag)
    db.commit()
    db.refresh(db_diag)
    return db_diag

@router.get("/diagnoses/{patient_id}")
def get_diagnoses(patient_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Diagnosis).filter(
        models.Diagnosis.patient_id == patient_id
    ).order_by(models.Diagnosis.diagnosed_at.desc()).all()
    return [
        {
            "id": r.id, "patient_id": r.patient_id,
            "diagnosis": r.diagnosis, "severity": r.severity,
            "confidence": r.confidence,
            "diagnosed_at": r.diagnosed_at.isoformat() if r.diagnosed_at else None,
        }
        for r in rows
    ]