from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func
from database import Base
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.hybrid import hybrid_property

class Material(Base):
    __tablename__ = "materials"

    material_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    mark: Mapped[str] = mapped_column()
    quantity: Mapped[int] = mapped_column()
    value: Mapped[float] = mapped_column()
    date_available: Mapped[Optional[datetime]] = mapped_column()
    expired: Mapped[bool] = mapped_column(default=False)
    available: Mapped[bool] = mapped_column(default=True)

    @hybrid_property
    def total_value(self):
        return self.quantity * self.value