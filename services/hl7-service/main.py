from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, HL7Message, Base, engine
from parser import parse_message, get_sample_messages, SAMPLE_MESSAGES
from fhir_converter import hl7_to_fhir_bundle
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HL7 Service",
    description="HL7 v2 parsing and FHIR R4 conversion pipeline. Portfolio demonstration only.",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "HL7 Service"}

@app.post("/messages")
def receive_message(payload: schemas.HL7MessageCreate, db: Session = Depends(get_db)):
    parsed = parse_message(payload.raw_message)
    db_msg = HL7Message(
        message_type=parsed["message_type"],
        raw_message=payload.raw_message,
        processed=True
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return {"id": db_msg.id, "message_type": db_msg.message_type, "parsed": parsed}

@app.post("/parse")
def parse_hl7(payload: schemas.HL7MessageCreate):
    parsed = parse_message(payload.raw_message)
    return parsed

@app.post("/convert/fhir")
def convert_to_fhir(payload: schemas.HL7MessageCreate):
    parsed = parse_message(payload.raw_message)
    bundle = hl7_to_fhir_bundle(parsed)
    return bundle

@app.get("/messages")
def get_messages(db: Session = Depends(get_db)):
    return db.query(HL7Message).order_by(HL7Message.received_at.desc()).limit(100).all()

@app.post("/simulate")
def simulate_messages(db: Session = Depends(get_db)):
    inserted = []
    for raw in SAMPLE_MESSAGES:
        parsed = parse_message(raw)
        db_msg = HL7Message(
            message_type=parsed["message_type"],
            raw_message=raw,
            processed=True
        )
        db.add(db_msg)
        db.commit()
        db.refresh(db_msg)
        inserted.append({"id": db_msg.id, "message_type": db_msg.message_type})
    return {"inserted": len(inserted), "messages": inserted}

@app.get("/samples")
def get_sample_parsed():
    return get_sample_messages()