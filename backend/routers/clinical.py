from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine
import models, schemas

router = APIRouter(prefix="/clinical", tags=["clinical"])

# Auto-create cv_results table if it doesn't exist yet
models.CVResult.__table__.create(bind=engine, checkfirst=True)

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

@router.post("/cv-result/")
def save_cv_result(data: schemas.CVResultCreate, db: Session = Depends(get_db)):
    # Keep only the latest — delete previous results for this patient
    db.query(models.CVResult).filter(models.CVResult.patient_id == data.patient_id).delete()
    row = models.CVResult(
        patient_id=data.patient_id,
        image_data=data.image_data,
        diagnosis=data.diagnosis,
        confidence=data.confidence,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "analyzed_at": row.analyzed_at.isoformat() if row.analyzed_at else None}

@router.get("/cv-result/{patient_id}")
def get_cv_result(patient_id: int, db: Session = Depends(get_db)):
    row = db.query(models.CVResult).filter(
        models.CVResult.patient_id == patient_id
    ).order_by(models.CVResult.analyzed_at.desc()).first()
    if not row:
        return {"exists": False}
    return {
        "exists": True,
        "id": row.id,
        "patient_id": row.patient_id,
        "image_data": row.image_data,
        "diagnosis": row.diagnosis,
        "confidence": row.confidence,
        "analyzed_at": row.analyzed_at.isoformat() if row.analyzed_at else None,
    }