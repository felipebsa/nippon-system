from pydantic import BaseModel
from typing import Optional
from datetime import datetime
class SchemaMaterialCreate(BaseModel):
    name: str 
    mark: str 
    quantity: int 
    value: float 
    date_available: Optional[datetime]
    expired: bool 
    available: bool 

class SchemaMaterialUpdate(BaseModel):
    name: Optional[str] 
    mark: Optional[str] 
    quantity: Optional[int] 
    value: Optional[float]  
    date_available: Optional[datetime]
    expired: Optional[bool]  
    available: Optional[bool]  
class SchemaMaterialExpired(BaseModel):
    expired: bool 
class SchemaMaterialAvailable(BaseModel):
    available: bool 
class SchemaMaterialStock(BaseModel):
    quantity: Optional[int] 
    value: Optional[float]   
class SchemaMaterialResponse(BaseModel):
    model_config = {"from_attributes": True}
    material_id: int
    name: str 
    mark: str 
    quantity: int 
    value: float 
    total_value: float 
    date_available: Optional[datetime]
    expired: bool 
    available: bool 