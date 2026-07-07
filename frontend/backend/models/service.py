from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, func
from database import Base
from typing import Optional
from datetime import datetime

class Service(Base):
    __tablename__ = "services"

    service_id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.vehicle_id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.client_id"))
    title: Mapped[str] = mapped_column()
    desc: Mapped[str] = mapped_column()
    date_release: Mapped[Optional[datetime]] = mapped_column()
    created: Mapped[datetime] = mapped_column(server_default=func.now())
    labor_value: Mapped[Optional[float]] = mapped_column()
    kind: Mapped[str] = mapped_column()
    finish: Mapped[bool] = mapped_column(default=False)
    value: Mapped[float] = mapped_column()