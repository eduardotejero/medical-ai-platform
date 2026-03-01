from sqlalchemy import Column, Integer, String, Float, Boolean, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String(20), unique=True, nullable=False)
    age = Column(Integer)
    gender = Column(String(10))
    fitzpatrick_type = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())

class ClinicalData(Base):
    __tablename__ = "clinical_data"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    lesion_diameter = Column(Float)
    uv_exposure = Column(Float)
    abcde_score = Column(Float)
    recorded_at = Column(TIMESTAMP, server_default=func.now())

class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    diagnosis = Column(String(100))
    severity = Column(Integer)
    confidence = Column(Float)
    diagnosed_at = Column(TIMESTAMP, server_default=func.now())

class TestOrder(Base):
    __tablename__ = "test_orders"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    patient_code = Column(String(20))
    patient_age = Column(Integer)
    patient_gender = Column(String(10))
    test_type = Column(String(100), default="Skin Lesion Analysis")
    hl7_message = Column(Text)
    status = Column(String(20), default="PENDING")
    created_at = Column(TIMESTAMP, server_default=func.now())
