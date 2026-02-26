from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/", response_model=list[schemas.PatientResponse])
def get_patients(db: Session = Depends(get_db)):
    return db.query(models.Patient).all()

@router.get("/{patient_id}", response_model=schemas.PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/", response_model=schemas.PatientResponse)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient