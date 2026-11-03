from sqlmodel import Session, select

from app.modules.unidades_medida.model import TipoUnidad, UnidadMedida

UNIDADES_INICIALES = [
    ("kilogramo", "kg", TipoUnidad.peso),
    ("gramo", "g", TipoUnidad.peso),
    ("litro", "L", TipoUnidad.volumen),
    ("mililitro", "mL", TipoUnidad.volumen),
    ("pieza", "u", TipoUnidad.contable),
    ("docena", "doc", TipoUnidad.contable),
]


def seed_unidades_medida(session: Session) -> None:
    """Inserta las 6 unidades solo si la tabla está vacía (idempotente)."""
    if session.exec(select(UnidadMedida).limit(1)).first() is not None:
        return
    for nombre, simbolo, tipo in UNIDADES_INICIALES:
        session.add(UnidadMedida(nombre=nombre, simbolo=simbolo, tipo=tipo))
    session.commit()
