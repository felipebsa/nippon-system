from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.user import User
from schemas.user import SchemaLogin, SchemaRegister, SchemaUserResponse
from database import get_db
from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv
import os

load_dotenv()
router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

pwd_context = CryptContext(schemes=['bcrypt'])

@router.get("/")
def auth_home():
    return {"message": "auth_home successful"}

@router.post("/auth/register")
def create_user(user: SchemaRegister, db: Session = Depends(get_db)):
    query = select(User).where(User.email==user.email)
    db_user = db.execute(query).scalars().first()
    if db_user:
        raise HTTPException(status_code=409, detail="email exists")
    hash_created = pwd_context.hash(user.password)
    post_user = User(
        email = user.email,
        pass_hash = hash_created,
        role = user.role
    )
    db.add(post_user)
    db.commit()
    return {"message": "successful create_user"}

@router.post("/auth/login")
def acess_user(user: SchemaLogin, db: Session = Depends(get_db)):
    query = select(User).where(User.email==user.email)
    db_user = db.execute(query).scalars().first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="email not exists")
    is_valid = pwd_context.verify(user.password, db_user.pass_hash)
    if not is_valid:
        raise HTTPException(status=401, detail="password incorrect")
    payload = {
        "user_id": db_user.user_id,
        "email": db_user.email,
        "role": db_user.role
    }
    token = jwt.encode(payload, SECRET_KEY, ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}