from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select, update

from app.modules.categorias.model import Categoria
from app.modules.productos.model import Producto, ProductoCategoria
from app.modules.productos.schema import (
    CategoriaDeProducto,
    ClasificarProducto,
    ProductoCreate,
    ProductoPublic,
    ProductoUpdate,
)
from app.modules.unidades_medida.model import TipoUnidad, UnidadMedida


# --- Helpers de validación ------------------------------------------------------
def _obtener_producto(session: Session, producto_id: int) -> Producto:
    producto = session.get(Producto, producto_id)
    if producto is None:  # RN-03
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
    return producto


def _obtener_unidad(session: Session, unidad_id: int) -> UnidadMedida:
    unidad = session.get(UnidadMedida, unidad_id)
    if unidad is None:  # RN-03: FK a un id inexistente
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unidad de medida no encontrada")
    return unidad


def _validar_stock_segun_unidad(unidad: UnidadMedida, stock: Decimal) -> None:
    """RN-10: si la unidad es contable, el stock debe ser entero."""
    if unidad.tipo == TipoUnidad.contable and stock != stock.to_integral_value():
        raise HTTPException(
            422,
            f"El stock debe ser un número entero para la unidad '{unidad.nombre}' (contable)",
        )


def _validar_nombre_unico(session: Session, nombre: str, excluir_id: int | None = None) -> None:
    """RN-02: el nombre es único entre los productos activos."""
    consulta = select(Producto.id).where(
        Producto.activo == True,  # noqa: E712
        func.lower(Producto.nombre) == nombre.lower(),
    )
    if excluir_id is not None:
        consulta = consulta.where(Producto.id != excluir_id)
    if session.exec(consulta).first() is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Ya existe un producto activo con el nombre '{nombre}'"
        )


# --- Armado de la respuesta -----------------------------------------------------
def _categorias_por_producto(
    session: Session, producto_ids: list[int]
) -> dict[int, list[CategoriaDeProducto]]:
    resultado: dict[int, list[CategoriaDeProducto]] = {pid: [] for pid in producto_ids}
    if not producto_ids:
        return resultado
    filas = session.exec(
        select(
            ProductoCategoria.producto_id,
            Categoria.id,
            Categoria.nombre,
            Categoria.activo,
            ProductoCategoria.es_principal,
        )
        .join(Categoria, Categoria.id == ProductoCategoria.categoria_id)
        .where(ProductoCategoria.producto_id.in_(producto_ids))
        .order_by(ProductoCategoria.es_principal.desc(), Categoria.nombre)
    ).all()
    for producto_id, cat_id, cat_nombre, cat_activo, es_principal in filas:
        resultado[producto_id].append(
            CategoriaDeProducto(
                id=cat_id, nombre=cat_nombre, activo=cat_activo, es_principal=es_principal
            )
        )
    return resultado


def _a_public(
    producto: Producto, categorias: list[CategoriaDeProducto]
) -> ProductoPublic:
    return ProductoPublic(
        id=producto.id,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_base=producto.precio_base,
        stock_cantidad=producto.stock_cantidad,
        hay_stock=producto.stock_cantidad > 0,  # RN-11: se calcula, no se persiste
        disponible=producto.disponible,
        activo=producto.activo,
        anulado_at=producto.anulado_at,
        unidad_venta=producto.unidad_venta,
        categorias=categorias,
    )


# --- Casos de uso ---------------------------------------------------------------
def crear_producto(session: Session, datos: ProductoCreate) -> ProductoPublic:
    unidad = _obtener_unidad(session, datos.unidad_venta_id)
    _validar_stock_segun_unidad(unidad, datos.stock_cantidad)
    _validar_nombre_unico(session, datos.nombre)

    producto = Producto(**datos.model_dump())
    session.add(producto)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un producto activo con ese nombre")
    session.refresh(producto)
    return _a_public(producto, [])


def listar_productos(
    session: Session,
    skip: int,
    limit: int,
    activo: bool | None,
    disponible: bool | None,
    categoria_id: int | None,
    search: str | None,
) -> list[ProductoPublic]:
    consulta = select(Producto).options(selectinload(Producto.unidad_venta))

    # Omitido o true -> solo activos; false -> solo anulados
    consulta = consulta.where(Producto.activo == (True if activo is None else activo))
    if disponible is not None:
        consulta = consulta.where(Producto.disponible == disponible)
    if categoria_id is not None:
        # IN (subconsulta): no duplica filas aunque el producto tenga varios vínculos
        consulta = consulta.where(
            Producto.id.in_(
                select(ProductoCategoria.producto_id).where(
                    ProductoCategoria.categoria_id == categoria_id
                )
            )
        )
    if search:
        consulta = consulta.where(Producto.nombre.icontains(search.strip(), autoescape=True))

    productos = session.exec(consulta.order_by(Producto.id).offset(skip).limit(limit)).all()
    categorias = _categorias_por_producto(session, [p.id for p in productos])
    return [_a_public(p, categorias[p.id]) for p in productos]


def obtener_producto(session: Session, producto_id: int) -> ProductoPublic:
    producto = _obtener_producto(session, producto_id)
    categorias = _categorias_por_producto(session, [producto.id])
    return _a_public(producto, categorias[producto.id])


def actualizar_producto(session: Session, producto_id: int, datos: ProductoUpdate) -> ProductoPublic:
    producto = _obtener_producto(session, producto_id)
    if not producto.activo:  # RN-05
        raise HTTPException(status.HTTP_409_CONFLICT, "No se puede modificar un producto anulado")
    unidad = _obtener_unidad(session, datos.unidad_venta_id)
    _validar_stock_segun_unidad(unidad, datos.stock_cantidad)  # también si cambia la unidad
    _validar_nombre_unico(session, datos.nombre, excluir_id=producto.id)

    # PUT reemplaza los campos propios; activo y anulado_at no se tocan (RN-12)
    for campo, valor in datos.model_dump().items():
        setattr(producto, campo, valor)
    session.add(producto)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un producto activo con ese nombre")
    session.refresh(producto)
    categorias = _categorias_por_producto(session, [producto.id])
    return _a_public(producto, categorias[producto.id])


def anular_producto(session: Session, producto_id: int) -> None:
    producto = _obtener_producto(session, producto_id)
    if not producto.activo:  # RN-04
        raise HTTPException(status.HTTP_409_CONFLICT, "El producto ya está anulado")
    # Baja lógica: no se borra la fila y no se modifican disponible ni stock (RN-12)
    producto.activo = False
    producto.anulado_at = datetime.now(timezone.utc)
    session.add(producto)
    session.commit()


# --- Relación N:N Producto <-> Categoría ---------------------------------------
def clasificar_producto(
    session: Session, producto_id: int, datos: ClasificarProducto
) -> CategoriaDeProducto:
    producto = _obtener_producto(session, producto_id)  # 404 si no existe
    categoria = session.get(Categoria, datos.categoria_id)
    if categoria is None:  # RN-03
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoría no encontrada")
    if not producto.activo:  # RN-08
        raise HTTPException(status.HTTP_409_CONFLICT, "No se puede clasificar un producto anulado")
    if not categoria.activo:  # RN-08
        raise HTTPException(status.HTTP_409_CONFLICT, "No se puede clasificar en una categoría anulada")
    vinculo = session.get(ProductoCategoria, (producto.id, categoria.id))
    if vinculo is not None:  # RN-07
        raise HTTPException(status.HTTP_409_CONFLICT, "El producto ya está clasificado en esa categoría")

    if datos.es_principal:
        # RN-09: en la misma operación, la categoría principal anterior deja de serlo.
        # Se hace antes del INSERT para respetar el índice único parcial.
        session.exec(
            update(ProductoCategoria)
            .where(ProductoCategoria.producto_id == producto.id)
            .where(ProductoCategoria.es_principal == True)  # noqa: E712
            .values(es_principal=False)
        )
    session.add(
        ProductoCategoria(
            producto_id=producto.id, categoria_id=categoria.id, es_principal=datos.es_principal
        )
    )
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "El producto ya está clasificado en esa categoría")
    return CategoriaDeProducto(
        id=categoria.id,
        nombre=categoria.nombre,
        activo=categoria.activo,
        es_principal=datos.es_principal,
    )


def listar_categorias_de_producto(session: Session, producto_id: int) -> list[CategoriaDeProducto]:
    producto = _obtener_producto(session, producto_id)
    return _categorias_por_producto(session, [producto.id])[producto.id]
