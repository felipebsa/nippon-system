from pydantic import BaseModel
from typing import Optional
from datetime import datetime
class SchemaClientCreate(BaseModel):
    name: str
    cpf: str
    cep: Optional[str]
    address: Optional[str]
    email: Optional[str]
    tel: Optional[str]

class SchemaClientUpdate(BaseModel):
    name: Optional[str]
    cpf: Optional[str]
    cep: Optional[str]
    address: Optional[str]
    email: Optional[str]
    tel: Optional[str]
    expired:  Optional[bool]

class SchemaClientAddress(BaseModel):
    cep: Optional[str]
    address: Optional[str]

class SchemaClientContact(BaseModel):
    email: Optional[str]
    tel: Optional[str]

class SchemaExpired(BaseModel):
    expired: bool

class SchemaClientResponse(BaseModel):
    client_id: int
    name: str
    cpf: str
    cep: Optional[str]
    address: Optional[str]
    email: Optional[str]
    tel: Optional[str]
    expired:  bool
    created: datetime