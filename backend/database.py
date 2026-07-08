from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

class Base(DeclarativeBase):
	pass

SessionLocal = sessionmaker(bind=engine)

def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()