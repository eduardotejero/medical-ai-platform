from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import urllib.request, urllib.error, json as _json
from database import get_db, engine
from models import TestOrder, Base

router = APIRouter()

# Create table on startup if it doesn't exist yet
TestOrder.__table__.create(bind=engine, checkfirst=True)


class OrderCreate(BaseModel):
    patient_id: int
    patient_code: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    test_type: Optional[str] = "Skin Lesion Analysis"


class StatusUpdate(BaseModel):
    status: str  # PENDING | COMPLETED | CANCELLED


def generate_hl7(order_id: int, patient_id: int, patient_code: str,
                 patient_age: Optional[int], patient_gender: Optional[str],
                 test_type: str) -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    dob = ""
    if patient_age:
        birth_year = datetime.now().year - patient_age
        dob = f"{birth_year}0101"
    g = (patient_gender or "U")[0].upper()
    num = f"ORD{order_id:06d}"

    segments = [
        f"MSH|^~\\&|MEDICALAI|HOSPITAL|LAB|HOSPITAL|{ts}||ORM^O01|{num}|P|2.5",
        f"PID|1|{patient_id}|{patient_code}^^^HOSPITAL^MR|||{dob}|{g}",
        f"ORC|NW|{num}|||SC||||{ts}|||",
        f"OBR|1|{num}||SKIN^{test_type}^L|||{ts}||||||||||||||||",
    ]
    return "\r".join(segments)


def _push_to_hl7(raw_message: str):
    """Fire-and-forget: send the HL7 message to the HL7 service."""
    try:
        data = _json.dumps({"raw_message": raw_message}).encode()
        req = urllib.request.Request(
            "http://medicalai_hl7:8002/messages", data=data,
            headers={"Content-Type": "application/json"}, method="POST",
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass  # HL7 service is optional


def _serialize(o: TestOrder) -> dict:
    return {
        "id": o.id,
        "patient_id": o.patient_id,
        "patient_code": o.patient_code,
        "patient_age": o.patient_age,
        "patient_gender": o.patient_gender,
        "test_type": o.test_type,
        "status": o.status,
        "hl7_message": o.hl7_message,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    }


@router.get("/")
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(TestOrder).order_by(TestOrder.created_at.desc()).all()
    return [_serialize(o) for o in orders]


@router.post("/")
def create_order(body: OrderCreate, db: Session = Depends(get_db)):
    order = TestOrder(
        patient_id=body.patient_id,
        patient_code=body.patient_code,
        patient_age=body.patient_age,
        patient_gender=body.patient_gender,
        test_type=body.test_type or "Skin Lesion Analysis",
        status="PENDING",
        hl7_message="",  # placeholder until we have the id
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Now generate HL7 with the real order id
    order.hl7_message = generate_hl7(
        order.id, body.patient_id, body.patient_code,
        body.patient_age, body.patient_gender, order.test_type,
    )
    db.commit()
    db.refresh(order)
    # Push ORM^O01 to the HL7 service feed (best-effort)
    _push_to_hl7(order.hl7_message)
    return _serialize(order)


@router.patch("/{order_id}/status")
def update_status(order_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(TestOrder).filter(TestOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = body.status
    db.commit()
    return _serialize(order)


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(TestOrder).filter(TestOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"deleted": order_id}
