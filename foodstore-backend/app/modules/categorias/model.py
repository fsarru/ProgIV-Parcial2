from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import Index, text
from sqlmodel import Field, Relationship, SQLModel

from app.modules.productos.model import ProductoCategoria

if TYPE_CHECKING:
    from app.modules.productos.model import Producto


class Categoria(SQLModel, table=True):
    __tablename__ = "categoria"
    __table_args__ = (
        # RN-02: nombre único solo entre las categorías activas
        Index(
            "uq_categoria_nombre_activa",
            "nombre",
            unique=True,
            postgresql_where=text("activo"),
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(min_length=3)
    descripcion: str | None = Field(default=None)
    activo: bool = Field(default=True)
    anulado_at: datetime | None = Field(default=None)

    # Relación N:N con Producto a través de ProductoCategoria
    productos: List["Producto"] = Relationship(
        back_populates="categorias", link_model=ProductoCategoria
    )
