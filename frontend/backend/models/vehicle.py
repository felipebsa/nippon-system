from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func, ForeignKey
from database import Base
from typing import Optional
from datetime import datetime

class Vehicle(Base):
    __tablename__ = "vehicles"


    vehicle_id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.client_id"))
    model: Mapped[str] = mapped_column()
    plate: Mapped[str] = mapped_column(unique=True)
    kind: Mapped[Optional[str]] = mapped_column()
    created: Mapped[datetime] = mapped_column(server_default=func.now())
    active: Mapped[bool] = mapped_column(default=True)
    services = relationship("Service", cascade="all, delete-orphan")
