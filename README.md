## Frontend (React + TypeScript)

SPA con **React 19, Vite, TypeScript estricto**, React Router, TanStack Query, Axios, React Hook Form + Zod y Recharts.

### Ejecutar
```bash
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:3000/api
pnpm install
pnpm dev                 # http://localhost:5173  (el backend debe tener CORS_ORIGINS=http://localhost:5173)
pnpm build               # tsc -b + vite build
pnpm lint
```

### Estructura
| Carpeta | Contenido |
|---|---|
| `src/Tipos` | Tipos de la API y el cliente Axios (`api/cliente.ts`, `api/sesion.ts`) |
| `src/services` | Una función por endpoint; ningún componente llama a Axios directo |
| `src/schemas` | Validaciones Zod que reflejan las del backend (el backend sigue siendo la fuente de verdad) |
| `src/hooks`, `src/context` | `useAuth`, `useCarrito`, `useDebounce`, `AuthContext` |
| `src/Components` | Piezas reutilizables (`TablaPaginada`, `EstadoConsulta`, `Campo`, `SubirImagen`, `RutaProtegida`…) |
| `src/Pages` | Pantallas; `Pages/admin` para el personal de la tienda |

### Sesión y tokens
- El **access token** vive solo en memoria; el **refresh token** en el almacenamiento del navegador.
- Al abrir la app se renueva la sesión una sola vez (promesa compartida, para no disparar la detección de reutilización del refresh token) y se consulta `/auth/yo`.
- Un interceptor reintenta una vez las peticiones que reciben 401; si la renovación falla se cierra la sesión y se limpia la caché.
- El carrito de invitado usa `x-carrito-token`; al iniciar sesión se fusiona con `POST /carrito/fusionar`.

### Rutas por rol
| Ruta | Acceso |
|---|---|
| `/`, `/catalogo/producto/:id`, `/carrito`, `/login`, `/registro` | Público |
| `/mis-pedidos`, `/checkout`, `/pedido/:id/confirmacion` | Cliente |
| `/pedidos/:id` | Sesión iniciada (el servidor valida que sea suyo o que sea personal) |
| `/admin/pedidos`, `/admin/inventario` | Operador y Administrador |
| `/admin`, `/admin/productos`, `/admin/categorias`, `/admin/cupones`, `/admin/usuarios`, `/admin/bitacora` | Administrador |

La protección real está en el backend; las rutas protegidas solo evitan mostrar pantallas inútiles.

### Decisiones
- Paginación, filtros y orden **en el servidor**; la tabla solo pinta la página recibida.
- Cada pantalla con datos cubre cargando / error / vacío (`EstadoConsulta`).
- Imágenes: el navegador sube directo a Cloudinary con una firma del backend; la API nunca recibe el archivo.
- Fechas en hora de Guatemala (UTC-6) con `Intl.DateTimeFormat`.
- Diseño responsive mobile-first: las tablas se vuelven tarjetas en pantallas angostas.
