from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from schemas.client import SchemaClientResponse, SchemaClientCreate, SchemaClientUpdate, SchemaClientExpired
from models.client import Client
from models.vehicle import Vehicle
from models.service import Service
from database import get_db 
from routes.auth import get_current_user

router = APIRouter()

@router.post("/client/register", status_code=201)
def create_client(client: SchemaClientCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    db_client = Client(
        name = client.name,
        cpf = client.cpf,
        cep = client.cep,
        address = client.address,
        email = client.email,
        tel = client.tel
    )
    db.add(db_client)
    db.commit()
    return {"message": "successful create_client"}

@router.get("/client/get/all")
def get_all_clients(db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Client)
    db_clients = db.execute(query).scalars().all()
    if not db_clients:
        raise HTTPException(status_code=404, detail="not found")
    return db_clients

@router.get("/client/get/id/{id}")
def get_client_by_id(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Client).where(Client.client_id==id)
    db_client = db.execute(query).scalars().first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="not found")
    return db_client

@router.get("/client/get/expired/{bool}")
def get_expired_clients(bool: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Client).where(Client.expired==bool)
    db_clients = db.execute(query).scalars().all()
    if not db_clients:
        raise HTTPException(status_code=404, detail="not found")
    return db_clients

@router.get("/client/get/incomplete")
def get_client_none(db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Client).where(or_(Client.cep==None, Client.address==None, Client.email==None, Client.tel==None))
    db_clients = db.execute(query).scalars().all()
    if not db_clients:
        raise HTTPException(status_code=404, detail="not found")
    return db_clients

@router.delete("/client/delete/{id}", status_code=204)
def delete_client(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Client).where(Client.client_id==id)
    db_client = db.execute(query).scalars().first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="not found")
    db.delete(db_client)
    db.commit()
    return {"message": "successful delete_client"}

@router.put("/client/update/{id}")
def update_client(id: int, client: SchemaClientUpdate, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Client).where(Client.client_id==id)
    db_client = db.execute(query).scalars().first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="not found")
    db_client.name = client.name
    db_client.cpf = client.cpf
    db_client.cep = client.cep
    db_client.address = client.address
    db_client.email = client.email
    db_client.tel = client.tel
    db.commit()
    return {"message": "successful update_client"}

@router.patch("/client/update/expired/{id}")
def update_expired_client(id: int, client: SchemaClientExpired, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Client).where(Client.client_id==id)
    db_client = db.execute(query).scalars().first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="not found")
    db_client.expired = client.expired
    if client.expired == True:
        vehicle_query = select(Vehicle).where(Vehicle.client_id==id)
        db_vehicles = db.execute(vehicle_query).scalars().all()
        for vehicle in db_vehicles:
            vehicle.active = False
        service_query = select(Service).where(Service.client_id==id)
        db_services = db.execute(service_query).scalars().all()
        for service in db_services:
            service.finish = True
    db.commit()
    return {"message": "successful update_expired_client"}
