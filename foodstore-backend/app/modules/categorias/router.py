from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.categorias import service
from app.modules.categorias.schema import CategoriaCreate, CategoriaPublic, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["Categorías"])

CategoriaId = Annotated[int, Path(description="ID de la categoría")]


@router.post("", response_model=CategoriaPublic, status_code=status.HTTP_201_CREATED)
def crear_categoria(datos: CategoriaCreate, session: Session = Depends(get_session)):
    return service.crear_categoria(session, datos)


@router.get("", response_model=list[CategoriaPublic], status_code=status.HTTP_200_OK)
def listar_categorias(
    activo: Annotated[bool | None, Query(description="Omitido/true: activas; false: anuladas")] = None,
    search: Annotated[str | None, Query(description="Coincidencia parcial en el nombre")] = None,
    session: Session = Depends(get_session),
):
    return service.listar_categorias(session, activo, search)


@router.get("/{categoria_id}", response_model=CategoriaPublic, status_code=status.HTTP_200_OK)
def obtener_categoria(categoria_id: CategoriaId, session: Session = Depends(get_session)):
    return service.obtener_categoria(session, categoria_id)


@router.put("/{categoria_id}", response_model=CategoriaPublic, status_code=status.HTTP_200_OK)
def actualizar_categoria(
    categoria_id: CategoriaId, datos: CategoriaUpdate, session: Session = Depends(get_session)
):
    return service.actualizar_categoria(session, categoria_id, datos)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def anular_categoria(categoria_id: CategoriaId, session: Session = Depends(get_session)):
    service.anular_categoria(session, categoria_id)
