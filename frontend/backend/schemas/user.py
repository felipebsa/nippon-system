from pydantic import BaseModel

class SchemaRegister(BaseModel):
    username: str
    password: str
    role: str

class SchemaUserResponse(BaseModel):
    access_token: str
    token_type: str