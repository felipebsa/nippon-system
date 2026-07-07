from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from schemas.vehicle import SchemaVehicleActive, SchemaVehicleCreate, SchemaVehicleResponse, SchemaVehicleUpdate
from models.vehicle import Vehicle
from models.client import Client
from models.service import Service
from database import get_db 
from routes.auth import get_current_user

router = APIRouter()

@router.post("/vehicle/register", status_code=201)
def create_vehicle(vehicle: SchemaVehicleCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Client).where(Client.client_id==vehicle.client_id)
    get_query = db.execute(query).scalars().first()
    if get_query is None:
        raise HTTPException(status_code=404, detail="service id not found")
    db_vehicle = Vehicle(
        client_id = vehicle.client_id,
        model = vehicle.model,
        plate = vehicle.plate,
        kind = vehicle.kind
    )
    db.add(db_vehicle)
    db.commit()
    return {"message": "successful create_vehicle"}

@router.get("/vehicle/get/all")
def get_all_vehicles(db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Vehicle)
    db_vehicles = db.execute(query).scalars().all()
    if not db_vehicles:
        raise HTTPException(status_code=404, detail="not found")
    return db_vehicles

@router.get("/vehicle/get/id/{id}")
def get_vehicle_by_id(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Vehicle).where(Vehicle.vehicle_id==id)
    db_vehicle = db.execute(query).scalars().first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="not found")
    return db_vehicle

@router.get("/vehicle/get/active/{bool}")
def get_active_vehicles(bool: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Vehicle).where(Vehicle.active==bool)
    db_vehicles = db.execute(query).scalars().all()
    if not db_vehicles:
        raise HTTPException(status_code=404, detail="not found")
    return db_vehicles

@router.delete("/vehicle/delete/{id}", status_code=204)
def delete_vehicle(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Vehicle).where(Vehicle.vehicle_id==id)
    db_vehicle = db.execute(query).scalars().first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="not found")
    db.delete(db_vehicle)
    db.commit()
    return {"message": "successful delete_vehicle"}

@router.put("/vehicle/update/{id}")
def update_vehicle(id: int, vehicle: SchemaVehicleUpdate, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Vehicle).where(Vehicle.vehicle_id==id)
    db_vehicle = db.execute(query).scalars().first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="not found")
    db_vehicle.model = vehicle.model
    db_vehicle.plate = vehicle.plate
    db_vehicle.kind = vehicle.kind
    db.commit()
    return {"message": "successful update_vehicle"}


@router.patch("/vehicle/update/active/{id}")
def update_active_vehicle(id: int, vehicle: SchemaVehicleActive, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Vehicle).where(Vehicle.vehicle_id==id)
    db_vehicle = db.execute(query).scalars().first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="not found")
    db_vehicle.active = vehicle.active
    if vehicle.active == False:
        service_query = select(Service).where(Service.client_id==id)
        db_services = db.execute(service_query).scalars().all()
        for service in db_services:
            service.finish = True
    db.commit()
    return {"message": "successful update_active_vehicle"}
