from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PatientBase(BaseModel):
    patient_code: str
    age: Optional[int]
    gender: Optional[str]
    fitzpatrick_type: Optional[int] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ClinicalDataBase(BaseModel):
    patient_id: int
    lesion_diameter: Optional[float]
    uv_exposure: Optional[float]
    abcde_score: Optional[float]

class ClinicalDataResponse(ClinicalDataBase):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True

class DiagnosisCreate(BaseModel):
    patient_id: int
    diagnosis: str
    severity: int
    confidence: float

class DiagnosisResponse(DiagnosisCreate):
    id: int
    diagnosed_at: datetime

    class Config:
        from_attributes = True

class CVResultCreate(BaseModel):
    patient_id: int
    image_data: str        # base64 data-URL
    diagnosis: str
    confidence: float