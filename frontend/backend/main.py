from database import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#routers
from routes.auth import router as auth_router
from routes.user import router as user_router
from routes.service import router as service_router
from routes.material import router as material_router
from routes.client import router as client_router
from routes.vehicle import router as vehicle_router

#models
from models.user import  User
from models.service import Service
from models.material import Material
from models.client import Client
from models.vehicle import Vehicle
app = FastAPI()
Base.metadata.create_all(bind=engine)

#settings Cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

#include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(service_router)
app.include_router(material_router)
app.include_router(client_router)
app.include_router(vehicle_router)