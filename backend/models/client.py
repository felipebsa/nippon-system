from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func
from database import Base
from typing import Optional
from datetime import datetime

class Client(Base):
    __tablename__ = "clients"

    client_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    cpf: Mapped[str] = mapped_column(unique=True)
    cep: Mapped[Optional[str]] = mapped_column()
    address: Mapped[Optional[str]] = mapped_column()
    email: Mapped[Optional[str]] = mapped_column(unique=True)
    tel: Mapped[Optional[str]] = mapped_column()
    created: Mapped[datetime] = mapped_column(server_default=func.now())
    expired: Mapped[bool] = mapped_column(default=False)
