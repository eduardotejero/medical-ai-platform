from sqlalchemy import Column, Integer, String, Float, Boolean, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String(20), unique=True, nullable=False)
    age = Column(Integer)
    gender = Column(String(10))
    created_at = Column(TIMESTAMP, server_default=func.now())

class ClinicalData(Base):
    __tablename__ = "clinical_data"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    ige_total = Column(Float)
    eosinophils = Column(Float)
    skin_ph = Column(Float)
    tewl = Column(Float)
    recorded_at = Column(TIMESTAMP, server_default=func.now())

class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    diagnosis = Column(String(100))
    severity = Column(Integer)
    confidence = Column(Float)
    diagnosed_at = Column(TIMESTAMP, server_default=func.now())
