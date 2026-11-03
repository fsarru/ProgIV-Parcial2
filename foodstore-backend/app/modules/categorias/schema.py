from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

NombreStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]


class CategoriaBase(BaseModel):
    nombre: NombreStr
    descripcion: str | None = None


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(CategoriaBase):
    """PUT: actualiza nombre y descripcion."""


class CategoriaPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    activo: bool
    anulado_at: datetime | None
