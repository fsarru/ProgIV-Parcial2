# Food Store - Frontend (Administración del catálogo)

Aplicación **React + TypeScript** creada con **Vite** y estilada con **Tailwind CSS 4**.
Consume la API del backend con `fetch` nativo. El estado se maneja con `useState` y `useEffect`.
Segundo Parcial de Programación IV - UTN, Tecnicatura Universitaria en Programación.

## Requisitos
- Node.js 20.19 o superior (o 22.12+)
- El backend corriendo en http://localhost:8000 (ver `../foodstore-backend/README.md`)

## Instalación y ejecución
```powershell
npm install
npm run dev
```

La aplicación queda en http://localhost:5173 (origen habilitado por CORS en el backend).

Otros comandos:
```powershell
npm run build   # compila con TypeScript (strict: true) y genera dist/
npm run lint
```

### Otra URL para la API
Por defecto usa `http://localhost:8000/api/v1`. Para cambiarla, crear un archivo `.env` con:
```
VITE_API_URL=http://otra-direccion:8000/api/v1
```

## Qué permite hacer
- Ver el catálogo de productos activos: precio y stock con el símbolo de la unidad
  («$ 12,50 / kg», «stock: 3,5 kg»), indicadores *Disponible* / *Venta pausada* y
  *Con stock* / *Sin stock*, y las categorías (★ = principal).
- **Alta** y **edición** en un modal. El selector de unidad de venta se carga desde
  `GET /api/v1/unidades-medida`. Un error de la API (por ejemplo 409 por nombre repetido)
  se muestra dentro del modal sin cerrarlo.
- **Pausar / reanudar la venta** (PUT con `disponible` invertido).
- **Anular** un producto (DELETE, baja lógica) con confirmación.
- Estados de **carga** (esqueleto), **error** (con botón *Reintentar*) y **lista vacía**.

Las categorías y la clasificación de productos se operan desde la API (REST Client).

## Estructura
```
src/
├── App.tsx              # único dueño del estado: rutas de datos, modal y acciones
├── api.ts               # funciones fetch (solo las usa App.tsx)
├── formato.ts           # formato de precio y stock
├── main.tsx
├── index.css            # @import "tailwindcss"
├── types/               # Producto, UnidadMedida, Categoria (mismos campos que la API)
└── components/
    ├── Navbar.tsx
    ├── ProductoList.tsx       # recibe Producto[] por props y lo renderiza con .map()
    ├── ProductoCard.tsx       # precio, stock con símbolo, indicadores y botones
    ├── ProductoModal.tsx      # alta / edición (formulario con useState)
    ├── ConfirmarAnularModal.tsx
    ├── Modal.tsx · Campo.tsx · Boton.tsx · Insignia.tsx
    └── EstadoCarga.tsx · MensajeError.tsx · EstadoVacio.tsx
```

## Decisiones de diseño
- **Estado levantado a `App.tsx`**: los componentes hijos reciben datos y funciones por props;
  ninguno consulta la API por su cuenta.
- **Tipado estricto**: `strict: true`, sin `any`; los componentes declaran sus props con interfaces.
- **Formulario del modal**: un objeto de estado con los campos, vacío al crear y con los datos del
  producto al editar (el modal se monta con `key`, así se reinicia en cada apertura).
- **Refresco**: después de cada alta, edición, cambio de disponibilidad o anulación se vuelve a
  pedir el listado a la API.
- El listado pide `limit=50` (máximo que admite la API).
