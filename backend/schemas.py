from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PatientBase(BaseModel):
    patient_code: str
    age: Optional[int]
    gender: Optional[str]

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ClinicalDataBase(BaseModel):
    patient_id: int
    ige_total: Optional[float]
    eosinophils: Optional[float]
    skin_ph: Optional[float]
    tewl: Optional[float]

class ClinicalDataResponse(ClinicalDataBase):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True