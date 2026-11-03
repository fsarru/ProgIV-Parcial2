from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.productos import service
from app.modules.productos.schema import (
    CategoriaDeProducto,
    ClasificarProducto,
    ProductoCreate,
    ProductoPublic,
    ProductoUpdate,
)

router = APIRouter(prefix="/productos", tags=["Productos"])

ProductoId = Annotated[int, Path(description="ID del producto")]


@router.post("", response_model=ProductoPublic, status_code=status.HTTP_201_CREATED)
def crear_producto(datos: ProductoCreate, session: Session = Depends(get_session)):
    return service.crear_producto(session, datos)


@router.get("", response_model=list[ProductoPublic], status_code=status.HTTP_200_OK)
def listar_productos(
    skip: Annotated[int, Query(ge=0, description="Registros a saltear")] = 0,
    limit: Annotated[int, Query(ge=1, le=50, description="Máximo de registros")] = 10,
    activo: Annotated[bool | None, Query(description="Omitido/true: activos; false: anulados")] = None,
    disponible: Annotated[bool | None, Query(description="Filtra por disponible")] = None,
    categoria_id: Annotated[int | None, Query(description="Productos de esa categoría")] = None,
    search: Annotated[str | None, Query(description="Coincidencia parcial en el nombre")] = None,
    session: Session = Depends(get_session),
):
    return service.listar_productos(session, skip, limit, activo, disponible, categoria_id, search)


@router.get("/{producto_id}", response_model=ProductoPublic, status_code=status.HTTP_200_OK)
def obtener_producto(producto_id: ProductoId, session: Session = Depends(get_session)):
    return service.obtener_producto(session, producto_id)


@router.put("/{producto_id}", response_model=ProductoPublic, status_code=status.HTTP_200_OK)
def actualizar_producto(
    producto_id: ProductoId, datos: ProductoUpdate, session: Session = Depends(get_session)
):
    return service.actualizar_producto(session, producto_id, datos)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def anular_producto(producto_id: ProductoId, session: Session = Depends(get_session)):
    service.anular_producto(session, producto_id)


@router.post(
    "/{producto_id}/categorias",
    response_model=CategoriaDeProducto,
    status_code=status.HTTP_201_CREATED,
)
def clasificar_producto(
    producto_id: ProductoId, datos: ClasificarProducto, session: Session = Depends(get_session)
):
    return service.clasificar_producto(session, producto_id, datos)


@router.get(
    "/{producto_id}/categorias",
    response_model=list[CategoriaDeProducto],
    status_code=status.HTTP_200_OK,
)
def listar_categorias_de_producto(producto_id: ProductoId, session: Session = Depends(get_session)):
    return service.listar_categorias_de_producto(session, producto_id)
