from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from schemas.service import SchemaServiceCreate, SchemaServiceFinish, SchemaServiceResponse, SchemaServiceUpdate
from models.service import Service
from models.vehicle import Vehicle
from database import get_db 
from routes.auth import get_current_user


router = APIRouter()

@router.post("/service/register", status_code=201)
def create_service(service: SchemaServiceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Vehicle).where(Vehicle.vehicle_id==service.vehicle_id).where(Vehicle.client_id==service.client_id)
    get_query = db.execute(query).scalars().first()
    if get_query is None:
        raise HTTPException(status_code=404, detail="id not found")
    db_service = Service(
        client_id = service.client_id,
        vehicle_id = service.vehicle_id,
        title = service.title,
        desc = service.desc,
        date_release = service.date_release,
        kind = service.kind,
        value = service.value
    )
    db.add(db_service)
    db.commit()
    return {"message": "succesfull create_service"}

@router.get("/services/get/all")
def get_all_services(db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Service)
    get_query = db.execute(query).scalars().all()
    if not get_query:
        raise HTTPException(status_code=404, detail="not register services")
    return {"message": get_query}
    
@router.get("/service/get/{id}")
def get_by_id_service(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Service).where(Service.service_id==id)
    get_query = db.execute(query).scalars().first()
    if get_query is None:
        raise HTTPException(status_code=404, detail="not id found")
    return {"message": get_query}

@router.get("/services/get/{finish}")
def get_finish_services(finish: bool, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Service).where(Service.finish==finish)
    get_query = db.execute(query).scalars().all()
    if not get_query:
        raise HTTPException(status_code=404, detail="not found services")
    return  {"message": get_query}

@router.delete("/service/delete/{id}")
def delete_service(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Service).where(Service.service_id==id)
    db_service = db.execute(query).scalars().first()
    if db_service is None:
        raise HTTPException(status_code=404, detail="not id found")
    db.delete(db_service)
    db.commit()
    return {"message": "successful delete_service"}

@router.put("/service/update/{id}")
def update_service(id: int, service: SchemaServiceUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Service).where(Service.service_id==id)
    db_service = db.execute(query).scalars().first()
    if db_service is None:
        raise HTTPException(status_code=404, detail="not id found")
    db_service.title = service.title
    db_service.desc = service.desc
    db_service.date_release = service.date_release
    db_service.kind = service.kind
    db_service.value = service.value
    db.commit()
    return {"message": "succesfull update_service"}

@router.patch("/service/update/finish/{id}")
def update_finish_service(id: int, service: SchemaServiceFinish, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Service).where(Service.service_id==id)
    db_service = db.execute(query).scalars().first()
    if db_service is None:
        raise HTTPException(status_code=404, detail="not id found")
    db_service.finish = service.finish
    db.commit()
    return {"message": "successful update_finish_service"}