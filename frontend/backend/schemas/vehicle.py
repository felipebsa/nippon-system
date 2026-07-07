from pydantic import BaseModel
from typing import Optional
from datetime import datetime
class SchemaVehicleCreate(BaseModel):
    client_id: int
    model: str
    plate: str
    kind: Optional[str]

class SchemaVehicleUpdate(BaseModel):
    model: Optional[str]
    plate: Optional[str]
    kind: Optional[str]

class SchemaVehicleActive(BaseModel):
    active: bool

class SchemaVehicleResponse(BaseModel):
    vehicle_id: int
    client_id: int
    model: str
    plate: str
    kind: Optional[str]
    created: datetime
    active:  bool