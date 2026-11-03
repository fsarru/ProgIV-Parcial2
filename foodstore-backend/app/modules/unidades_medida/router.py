from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.modules.unidades_medida import service
from app.modules.unidades_medida.model import UnidadMedidaPublic

router = APIRouter(prefix="/unidades-medida", tags=["Unidades de medida"])


@router.get("", response_model=list[UnidadMedidaPublic], status_code=200)
def listar_unidades_medida(session: Session = Depends(get_session)):
    """Catálogo de solo lectura: origen del selector de unidad de venta."""
    return service.listar_unidades(session)
