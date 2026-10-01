# Licencias de abogados · Frontend

Angular 22.2 (standalone, signals, zoneless) + Angular Material 22. Node 24 LTS (ver `../.nvmrc`).

Pantallas según la **maqueta v13** (`../docs/Licencias-abogados_maqueta-simple-v13.html`):
**Consulta** libre y **Gestión** del contenidista, con la ventana de **Alta** (carga individual y
masiva). El backend lo desarrolla otro equipo: las llamadas están vacías (ver abajo).

## Correr

```bash
nvm use 24.21.0
npm install
npm start          # http://localhost:4200, /api se reenvía a 127.0.0.1:3000 (proxy.conf.json)
npm test           # Vitest
npx ng lint
npm run build
```

## Estructura

Sigue la de `CAS_Gestion_Usuarios_UI`:

```
src/app/
├─ components/
│  ├─ pages/
│  │  ├─ consulta/                   CU-01: filtros, tabla ordenable, exportar PDF
│  │  ├─ login/                      CU-02: usuario, contraseña y código por correo
│  │  └─ carga/                      Gestión de licencias (misma pantalla que la consulta + acciones)
│  │     ├─ tabla-gestion/           anuladas, tipo de licencia, lote, Corregir y Anular
│  │     ├─ alta-licencia-dialog/    ventana de Alta (pestañas) y de Corregir
│  │     ├─ carga-individual/        CU-03, CU-04 (lógica del formulario en carga-individual.form.ts)
│  │     └─ carga-masiva/            CU-08 · previsualizacion-lote/ · lotes-cargados/ (CU-09)
│  └─ shared/                        navbar, loading, filtros-licencias, modals/confirmacion-dialog
├─ guards/                           auth.guard.ts
├─ interceptors/                     api.interceptor.ts (cookie, barra de carga, 401, timeout)
├─ interfaces/                       un archivo por entidad (contrato con el back)
├─ pipes/                            fecha-ar.pipe.ts
├─ validators/                       comunes (entero, noVacio) y fechas (mínima, máxima, rango, mensajes)
└─ services/                         uno por área + utils/ (lista paginada, PDF, fechas, snackbar…)
src/styles/                          estilos globales por tema: _tema, _layout, _formularios, _tablas
```

## Comportamiento (maqueta v13)

- **Filtros** (Consulta y Gestión, dos filas de tres): nombre, matrícula, tipo de profesional, Colegio,
  **una sola** fecha de comienzo y días hábiles. Se aplican con **Buscar** o Enter, no al tipear.
- **Tablas**: 10 filas por página (10, 25 o 50). Columnas ordenables en el servidor: primer clic
  ascendente, segundo descendente. Buscar u ordenar vuelve a la página 1.
- **Exportar PDF**: todas las licencias de la búsqueda aplicada, en el orden elegido, solo campos
  públicos (en Gestión, solo vigentes). Se arma en el navegador con jsPDF (`services/utils/exportar-pdf.ts`).
- **Tipo de profesional**: Abogado/a (`A`) o Procurador/a (`P`), obligatorio en la carga.
- **Nombre y apellido** se cargan por separado y se envían como `«APELLIDO, Nombre»`.
- **Alta**: «Falta completar» aparece recién al pulsar Guardar. Corregir abre la misma ventana.
- **Anular** y **Revertir lote** piden confirmación Sí / No.

## Fechas

- Datepicker de Material con date-fns, DD/MM/AAAA, calendario en castellano. Se abre con el ícono.
- En los formularios las fechas son `Date`; a la API van como `'AAAA-MM-DD'` (`services/utils/fechas.ts`).
- En la carga, la fecha de comienzo es **posterior a hoy** (al corregir una licencia que ya empezó se
  puede conservar su fecha). El back debe validar lo mismo, también en la carga masiva.

## Configuración por entorno

Como en CAS: `public/assets/env/env.json` dice el entorno y `env.<entorno>.json` trae:

| Clave | Uso |
|---|---|
| `api_url` | Base de la API. Vacía en local (usa el proxy) |
| `omitir_login` | `"true"` solo en `env.local.json`: deja entrar a Carga sin sesión para ver las pantallas. Se ignora en builds de producción |

Al desplegar, `env.json` debe apuntar al entorno correcto (no dejar `local`).

## Sesión

- Usuario y contraseña contra la tabla de usuarios propia (bcrypt en el back), luego OTP nuevo por correo.
- La sesión es **solo una cookie HttpOnly** que pone el back. El front no usa localStorage ni
  sessionStorage; recupera el usuario con `GET /api/auth/yo`.
- Todos los pedidos van con `withCredentials`.
- CSRF: el front envía el header `X-XSRF-TOKEN` con el valor de la cookie `XSRF-TOKEN` en POST/PATCH.
  **El back tiene que emitir esa cookie** (no HttpOnly) y validar el header.

## Integración con el back (pendiente)

Cada método de `services/` tiene un `// TODO(back):` con la ruta propuesta. Mientras tanto:
las consultas devuelven vacío y las operaciones que modifican fallan con
"Pendiente de integrar con el back: …" (`services/utils/back-pendiente.ts`), para no simular guardados.

| Servicio | Método | Ruta propuesta |
|---|---|---|
| `AuthService` | `cargarSesion` / `login` / `verificarOtp` / `logout` | `GET /api/auth/yo` · `POST /api/auth/login` · `POST /api/auth/otp` · `POST /api/auth/logout` |
| `CatalogosService` | `obtenerColegios` | `GET /api/colegios` |
| | `obtenerTiposLicencia` | `GET /api/carga/tipos-licencia` |
| `LicenciasService` | `consultar` | `GET /api/licencias` |
| | `obtenerGestion` | `GET /api/carga/licencias` |
| | `obtenerParaExportar` | recorrer `GET /api/licencias?size=100` (o un endpoint de exportación) |
| | `controlar` | `GET /api/carga/licencias/control` |
| | `crear` / `corregir` / `anular` | `POST`, `PATCH /:id`, `POST /:id/anular` en `/api/carga/licencias` |
| `LotesService` | `descargarPlantilla` | `GET /api/carga/plantilla` (referencia: `../docs/plantilla_licencias_v13.xlsx`) |
| | `validarArchivo` | `POST /api/carga/lotes/validar` (multipart) |
| | `confirmar` / `obtenerLotes` / `revertir` | `/api/carga/lotes/...` |

**Parámetros de las listas** (`/api/licencias` y `/api/carga/licencias`): `nombre`, `matricula`,
`tipoProfesional` (`A`/`P`), `colegioId`, `fecha` (AAAA-MM-DD), `dias`, `sort`
(`colegio`, `nombre`, `matricula`, `tipoProfesional`, `fechaComienzo`, `diasHabiles`, `tipoLicencia`),
`dir` (`asc`/`desc`), `page`, `size` (máx. 100).

Las formas de los datos están en `interfaces/`. Si el back responde con `ApiResponse<T>`
(`{ dataset, returnset }`), mapear a `dataset` dentro del servicio: los componentes no cambian.
