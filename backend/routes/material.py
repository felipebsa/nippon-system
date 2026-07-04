from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from schemas.material import SchemaMaterialAvailable, SchemaMaterialCreate, SchemaMaterialExpired, SchemaMaterialResponse, SchemaMaterialUpdate, SchemaMaterialStock
from models.material import Material
from database import get_db 
from routes.auth import get_current_user

router = APIRouter()

@router.post("/material/register", status_code=201)
def create_material(material: SchemaMaterialCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    db_material = Material(
        name = material.name, 
        mark = material.mark,
        quantity = material.quantity,
        value = material.value,
        date_available = material.date_available,
        expired = material.expired,
        available = material.available
    )
    db.add(db_material)
    db.commit()
    return {"message": "successful create_material"}

@router.get("/material/get/all", response_model=list[SchemaMaterialResponse])
def get_all_materials(db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Material)
    db_materials = db.execute(query).scalars().all()
    if not db_materials:
        raise HTTPException(status_code=404, detail="not found")
    return db_materials

@router.get("/material/get/id/{id}", response_model=list[SchemaMaterialResponse])
def get_material_by_id(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.material_id==id)
    db_material = db.execute(query).scalars().first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="not found")
    return db_material

@router.get("/material/get/expired/{bool}")
def get_expired_materials(bool: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.expired==bool)
    db_materials = db.execute(query).scalars().all()
    if not db_materials:
        raise HTTPException(status_code=404, detail="not found")
    return db_materials

@router.get("/material/get/available/{bool}")
def get_available_materials(bool: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.available==bool)
    db_materials = db.execute(query).scalars().all()
    if not db_materials:
        raise HTTPException(status_code=404, detail="not found")
    return db_materials


@router.delete("/material/delete/{id}", status_code=204)
def delete_material(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.material_id==id)
    db_material = db.execute(query).scalars().first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="not found")
    db.delete(db_material)
    db.commit()
    return {"message": "successful delete_material"}

@router.put("/material/update/{id}")
def update_material(id: int, material: SchemaMaterialUpdate, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.material_id==id)
    db_material = db.execute(query).scalars().first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="not found")
    db_material.name = material.name
    db_material.mark = material.mark
    db_material.quantity = material.quantity
    db_material.value = material.value
    db_material.date_available = material.date_available
    db_material.expired = material.expired
    db_material.available = material.available
    db.commit()
    return {"message": "successful update_material"}

@router.patch("/material/update/stock/{id}")
def update_stock_material(id: int, material: SchemaMaterialStock, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.material_id==id)
    db_material = db.execute(query).scalars().first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="not found")
    db_material.value = material.value
    db_material.quantity = material.quantity
    db.commit()
    return {"message": "successful update_stock_material"}

@router.patch("/material/update/available/{id}")
def update_available_material(id: int, material: SchemaMaterialAvailable, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.material_id==id)
    db_material = db.execute(query).scalars().first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="not found")
    db_material.available = material.available
    db.commit()
    return {"message": "successful update_available_material"}

@router.patch("/material/update/expired/{id}")
def update_expired_material(id: int, material: SchemaMaterialExpired, db: Session=Depends(get_db), _=Depends(get_current_user)):
    query = select(Material).where(Material.material_id==id)
    db_material = db.execute(query).scalars().first()
    if db_material is None:
        raise HTTPException(status_code=404, detail="not found")
    db_material.expired = material.expired
    db.commit()
    return {"message": "successful update_expired_material"}
