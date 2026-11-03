from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, StringConstraints

from app.modules.unidades_medida.model import UnidadMedidaPublic

# --- Tipos con validaciones declaradas (RN-01) --------------------------------
NombreStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=100)]
PrecioDecimal = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=2)]
StockDecimal = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=3)]

# En la respuesta JSON los decimales salen como número (12.5) y no como texto ("12.50")
DecimalJson = Annotated[
    Decimal, PlainSerializer(lambda v: float(v), return_type=float, when_used="json")
]


# --- Entrada ------------------------------------------------------------------
class ProductoBase(BaseModel):
    nombre: NombreStr
    descripcion: str | None = None
    precio_base: PrecioDecimal
    unidad_venta_id: int
    stock_cantidad: StockDecimal = Decimal("0")
    disponible: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(ProductoBase):
    """PUT reemplaza los campos propios del producto (mismos campos que Create)."""


# --- Salida -------------------------------------------------------------------
class ClasificarProducto(BaseModel):
    """Body de POST /productos/{id}/categorias."""

    categoria_id: int
    es_principal: bool = False


class CategoriaDeProducto(BaseModel):
    id: int
    nombre: str
    activo: bool
    es_principal: bool


class ProductoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    precio_base: DecimalJson
    stock_cantidad: DecimalJson
    hay_stock: bool  # campo calculado (RN-11): stock_cantidad > 0
    disponible: bool
    activo: bool
    anulado_at: datetime | None
    unidad_venta: UnidadMedidaPublic
    categorias: list[CategoriaDeProducto] = []
