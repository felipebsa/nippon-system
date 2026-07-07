from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SchemaServiceCreate(BaseModel):
    vehicle_id: int
    client_id: int
    title: str
    desc: str
    date_release: Optional[datetime]
    kind: str
    value: float

class SchemaServiceUpdate(BaseModel):
    title: Optional[str]
    desc: Optional[str]
    date_release: Optional[datetime]
    kind: Optional[str]
    value: Optional[float]

class SchemaServiceFinish(BaseModel):
    finish: Optional[bool]

class SchemaServiceResponse(BaseModel):
    service_id: int
    vehicle_id: int
    client_id: int
    title: str
    desc: str
    date_release: Optional[datetime]
    created: datetime
    kind: str
    finish: bool
    value: float

