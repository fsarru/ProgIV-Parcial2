# Food Store - Backend (Catálogo de Productos)

API REST con **FastAPI + SQLModel + Pydantic v2** sobre **PostgreSQL**.
Segundo Parcial de Programación IV (Unidades 4, 5 y 6) - UTN, Tecnicatura Universitaria en Programación.

## Requisitos
- Python 3.12 o superior
- PostgreSQL 15 o superior

## 1. Base de datos
Crear una base vacía llamada `foodstore` (desde pgAdmin o con `psql`):

```sql
CREATE DATABASE foodstore;
```

### Cadena de conexión
Se define en `app/core/database.py`. Por defecto:

```
postgresql+psycopg2://postgres:foodstore123@localhost:5432/foodstore
```

Para usar otro usuario, contraseña o puerto **sin editar el código**, definir la variable de
entorno `DATABASE_URL` antes de iniciar la aplicación (PowerShell):

```powershell
$env:DATABASE_URL = "postgresql+psycopg2://USUARIO:CONTRASEÑA@localhost:5432/foodstore"
```

Las tablas y el seed de las unidades de medida se crean solos al iniciar la aplicación
(el seed solo inserta si la tabla está vacía, por lo que iniciar dos veces no duplica filas).

## 2. Instalación
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 3. Ejecución
```powershell
fastapi dev app/main.py
```

- API: http://localhost:8000
- Swagger (documentación interactiva): http://localhost:8000/docs
- CORS habilitado para el frontend en http://localhost:5173

## 4. Pruebas
Los archivos `.http` están en `tests/` (extensión **REST Client** de VS Code). Cada request indica
en su título el código HTTP esperado.

| Archivo | Cubre |
|---|---|
| `tests/productos.http` | CRUD de productos, paginación, los 4 filtros, validaciones 404/409/422, `hay_stock`, baja lógica |
| `tests/relaciones.http` | CRUD de categorías, relación N:N, cambio de categoría principal, RN-06 a RN-09, filtro `categoria_id` |

Para ejecutar **todos** a la vez (con el backend corriendo, en otra terminal con el `.venv` activo):

```powershell
python tests/run_http.py        # resumen, muestra solo los fallos
python tests/run_http.py -v     # muestra cada request
python tests/run_http.py productos   # solo los archivos cuyo nombre contenga "productos"
```

Resultado esperado: `TOTAL: 104 correctos, 0 con fallo, 104 requests`.

## 5. Endpoints (prefijo `/api/v1`)
| Método | Ruta | Código | Descripción |
|---|---|---|---|
| GET | `/unidades-medida` | 200 | Catálogo de unidades (solo lectura) |
| POST | `/productos` | 201 | Crear producto |
| GET | `/productos` | 200 | Listar (`skip`, `limit`, `activo`, `disponible`, `categoria_id`, `search`) |
| GET | `/productos/{id}` | 200 | Detalle con unidad, categorías, stock y `hay_stock` |
| PUT | `/productos/{id}` | 200 | Actualizar campos propios |
| DELETE | `/productos/{id}` | 204 | Baja lógica (`activo=false`, `anulado_at`) |
| POST | `/productos/{id}/categorias` | 201 | Clasificar en una categoría (`categoria_id`, `es_principal`) |
| GET | `/productos/{id}/categorias` | 200 | Categorías del producto indicando la principal |
| POST | `/categorias` | 201 | Crear categoría |
| GET | `/categorias` | 200 | Listar (`activo`, `search`) |
| GET | `/categorias/{id}` | 200 | Detalle |
| PUT | `/categorias/{id}` | 200 | Actualizar nombre y descripción |
| DELETE | `/categorias/{id}` | 204 | Baja lógica |

Los errores se devuelven con `HTTPException` en formato `{"detail": "..."}` (404, 409) y los de
validación de Pydantic con 422. Una petición rechazada no modifica la base.

## 6. Estructura
```
foodstore-backend/
├── app/
│   ├── main.py                 # app, CORS, lifespan (tablas + seed), routers
│   ├── core/
│   │   ├── database.py         # engine, get_session, cadena de conexión
│   │   └── seed.py             # seed idempotente de UnidadMedida
│   └── modules/
│       ├── unidades_medida/    # model · service · router (solo lectura)
│       ├── categorias/         # model · schema · service · router
│       └── productos/          # model (+ ProductoCategoria) · schema · service · router
├── tests/                      # productos.http · relaciones.http · run_http.py
├── requirements.txt
└── README.md
```

## 7. Decisiones de diseño
- **Routers sin lógica**: solo reciben la petición, inyectan la sesión (`Depends(get_session)`) y
  delegan en `service.py`.
- **Baja lógica**: `DELETE` marca `activo = false` y `anulado_at`; nunca borra la fila.
- **Nombre único entre activos (RN-02)**: validado en el servicio (409) y reforzado con un índice
  único parcial de PostgreSQL (`WHERE activo`), por lo que un registro anulado libera su nombre.
- **Una sola categoría principal (RN-09)**: índice único parcial sobre `producto_categoria`.
- **`hay_stock`**: campo calculado en cada lectura (`stock_cantidad > 0`), no se persiste.
- **Stock según unidad (RN-10)**: si la unidad es contable, el stock debe ser entero (422), también
  cuando cambia `unidad_venta_id`.
