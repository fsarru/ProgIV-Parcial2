from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.modules.categorias.model import Categoria
from app.modules.categorias.schema import CategoriaCreate, CategoriaUpdate


def _obtener_categoria(session: Session, categoria_id: int) -> Categoria:
    categoria = session.get(Categoria, categoria_id)
    if categoria is None:  # RN-03
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoría no encontrada")
    return categoria


def _validar_nombre_unico(session: Session, nombre: str, excluir_id: int | None = None) -> None:
    """RN-02: el nombre es único entre las categorías activas."""
    consulta = select(Categoria.id).where(
        Categoria.activo == True,  # noqa: E712
        func.lower(Categoria.nombre) == nombre.lower(),
    )
    if excluir_id is not None:
        consulta = consulta.where(Categoria.id != excluir_id)
    if session.exec(consulta).first() is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Ya existe una categoría activa con el nombre '{nombre}'"
        )


def crear_categoria(session: Session, datos: CategoriaCreate) -> Categoria:
    _validar_nombre_unico(session, datos.nombre)
    categoria = Categoria(**datos.model_dump())
    session.add(categoria)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una categoría activa con ese nombre")
    session.refresh(categoria)
    return categoria


def listar_categorias(
    session: Session, activo: bool | None, search: str | None
) -> list[Categoria]:
    # Omitido o true -> solo activas; false -> solo anuladas
    consulta = select(Categoria).where(Categoria.activo == (True if activo is None else activo))
    if search:
        consulta = consulta.where(Categoria.nombre.icontains(search.strip(), autoescape=True))
    return list(session.exec(consulta.order_by(Categoria.id)).all())


def obtener_categoria(session: Session, categoria_id: int) -> Categoria:
    return _obtener_categoria(session, categoria_id)


def actualizar_categoria(
    session: Session, categoria_id: int, datos: CategoriaUpdate
) -> Categoria:
    categoria = _obtener_categoria(session, categoria_id)
    if not categoria.activo:  # RN-05
        raise HTTPException(status.HTTP_409_CONFLICT, "No se puede modificar una categoría anulada")
    _validar_nombre_unico(session, datos.nombre, excluir_id=categoria.id)
    categoria.nombre = datos.nombre
    categoria.descripcion = datos.descripcion
    session.add(categoria)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una categoría activa con ese nombre")
    session.refresh(categoria)
    return categoria


def anular_categoria(session: Session, categoria_id: int) -> None:
    categoria = _obtener_categoria(session, categoria_id)
    if not categoria.activo:  # RN-04
        raise HTTPException(status.HTTP_409_CONFLICT, "La categoría ya está anulada")
    # RN-06: solo se anula la categoría; sus productos conservan su propio estado
    categoria.activo = False
    categoria.anulado_at = datetime.now(timezone.utc)
    session.add(categoria)
    session.commit()
