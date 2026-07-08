from pydantic import BaseModel

class SchemaRegister(BaseModel):
    username: str
    password: str

class SchemaUserResponse(BaseModel):
    access_token: str
    token_type: str