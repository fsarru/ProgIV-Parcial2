from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List

from sqlalchemy import CheckConstraint, Index, text
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.categorias.model import Categoria
    from app.modules.unidades_medida.model import UnidadMedida


class ProductoCategoria(SQLModel, table=True):
    """Link model del N:N Producto <-> Categoria (PK compuesta)."""

    __tablename__ = "producto_categoria"
    __table_args__ = (
        # RN-09: a lo sumo una fila con es_principal = true por producto
        Index(
            "uq_producto_categoria_principal",
            "producto_id",
            unique=True,
            postgresql_where=text("es_principal"),
        ),
    )

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    es_principal: bool = Field(default=False)


class Producto(SQLModel, table=True):
    __tablename__ = "producto"
    __table_args__ = (
        CheckConstraint("precio_base >= 0", name="ck_producto_precio_no_negativo"),
        CheckConstraint("stock_cantidad >= 0", name="ck_producto_stock_no_negativo"),
        # RN-02: nombre único solo entre los productos activos
        Index(
            "uq_producto_nombre_activo",
            "nombre",
            unique=True,
            postgresql_where=text("activo"),
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    unidad_venta_id: int = Field(foreign_key="unidad_medida.id")
    nombre: str = Field(min_length=3)
    descripcion: str | None = Field(default=None)
    precio_base: Decimal = Field(max_digits=12, decimal_places=2, ge=0)
    stock_cantidad: Decimal = Field(
        default=Decimal("0"), max_digits=12, decimal_places=3, ge=0
    )
    disponible: bool = Field(default=True)
    activo: bool = Field(default=True)
    anulado_at: datetime | None = Field(default=None)

    # Relación 1:N con UnidadMedida
    unidad_venta: "UnidadMedida" = Relationship(back_populates="productos")
    # Relación N:N con Categoria
    categorias: List["Categoria"] = Relationship(
        back_populates="productos", link_model=ProductoCategoria
    )
