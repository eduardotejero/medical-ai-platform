from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class HL7MessageCreate(BaseModel):
    raw_message: str

class HL7MessageResponse(BaseModel):
    id: int
    message_type: str
    processed: bool
    received_at: datetime

    class Config:
        from_attributes = True

class HL7ParseResponse(BaseModel):
    message_id: str
    message_type: str
    timestamp: str
    patient: Optional[dict] = None
    observations: Optional[list] = None

class FHIRBundleResponse(BaseModel):
    resourceType: str
    id: str
    type: str
    entry: list