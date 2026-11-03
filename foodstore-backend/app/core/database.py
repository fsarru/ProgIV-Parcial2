import os

from sqlmodel import Session, SQLModel, create_engine

# Cadena de conexión a PostgreSQL (se puede sobrescribir con la variable de
# entorno DATABASE_URL; ver README.md).
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:foodstore123@localhost:5432/foodstore",
)

engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables() -> None:
    """Crea las tablas de todos los modelos SQLModel importados."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependencia de FastAPI: entrega una sesión por request."""
    with Session(engine) as session:
        yield session
