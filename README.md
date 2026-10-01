# PJUD · Licencias de abogados

Sistema de consulta y carga de licencias especiales de abogados y procuradores del Poder Judicial de Santa Fe.

- **Consulta** (`/consulta`): libre, sin ingreso. Filtros, tabla ordenable y exportación a PDF.
- **Gestión** (`/carga`): solo para el contenidista. Alta individual y masiva por Excel, corrección y anulación.

Este repositorio contiene:

| Carpeta | Qué es |
|---|---|
| `frontend/` | Angular 22 (ver más abajo) |
| `backend/` | API Node 24 + Express 5 + Sequelize (ver [Backend](#backend)) |
| `db/` | Scripts de la base MySQL 5.7 |
| `deploy/` | Configuración de Apache, servicio y copias de seguridad (pendiente) |
| `docs/` | Maqueta v13 y planilla Excel de referencia |

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | **24.21.0 LTS** (ver `.nvmrc`) |
| npm | 11 (viene con Node 24) |
| Angular CLI | 22.2 (se instala con el proyecto, no hace falta global) |

Angular 22 **no funciona** con Node 16, 18 ni 20.

### Instalar Node 24 con nvm-windows

```bash
nvm install 24.21.0
nvm use 24.21.0
node -v
```

`nvm use` cambia el Node de toda la PC (puede pedir consola como administrador). Si no querés cambiarlo, en PowerShell podés usar Node 24 solo en esa consola:

```powershell
$env:Path = "$env:APPDATA\nvm\v24.21.0;$env:Path"
```

## Levantar el front

```bash
git clone https://github.com/i2TSAOrganization/PJUD_Licencias_Abogados.git
cd PJUD_Licencias_Abogados/frontend
npm install
npm start
```
## Configuración por entorno

La configuración se lee al iniciar desde `frontend/public/assets/env/`:

- `env.json` indica el entorno: `{ "env": "local" }`.
- `env.<entorno>.json` trae los valores de ese entorno.

| Clave | Uso |
|---|---|
| `api_url` | Base de la API. Vacía en local, porque usa el proxy |
| `omitir_login` | Solo en `env.local.json`: `"true"` deja entrar a Carga sin sesión para ver las pantallas. Se ignora en builds de producción |

Entornos incluidos: `local`, `development`, `sandbox`,`production`.

## Comandos

Desde `frontend/`:

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo con recarga automática |
| `npm test` | Pruebas unitarias (Vitest) |
| `npx ng lint` | ESLint |
| `npx prettier --write "src/**/*.{ts,html,scss}"` | Formatea el código |
| `npm run build` | Build de producción en `frontend/dist/frontend/browser/` |

## Despliegue

1. Compilar con `npm run build`.
2. Copiar el contenido de `frontend/dist/frontend/browser/` al servidor web (Apache).
3. Editar `assets/env/env.json` en el servidor con el entorno correcto. **No dejar `local`.**
4. Configurar el servidor web:
   - **Rutas de la aplicación:** que `/consulta`, `/carga` y `/login` sirvan `index.html`.
   - **API:** que `/api` se reenvíe al backend.
   - **Caché:** no cachear `index.html`. El resto de los archivos lleva hash en el nombre.

Ejemplo para Apache:

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]

ProxyPass        /api/ http://127.0.0.1:3000/api/
ProxyPassReverse /api/ http://127.0.0.1:3000/api/
```

## Sesión y seguridad

- **Ingreso:** usuario y contraseña, y después un código OTP enviado por correo.
- **Sesión:** solo una cookie HttpOnly que emite el back. El front no guarda nada en localStorage ni sessionStorage.
- **CSRF:** el front envía el header `X-XSRF-TOKEN` con el valor de la cookie `XSRF-TOKEN`. El back debe emitir esa cookie y validar el header.

## Estructura

```
frontend/src/app/
├─ components/
│  ├─ pages/       consulta, login, carga (gestión, alta, carga individual y masiva)
│  └─ shared/      navbar, loading, filtros, modales
├─ guards/         protección de /carga
├─ interceptors/   cookie de sesión, barra de carga, 401, timeout
├─ interfaces/     contrato de datos con el back
├─ pipes/
├─ validators/     validaciones reutilizables (fechas, enteros, textos)
└─ services/       llamadas al back y utilidades
frontend/src/styles/   estilos globales
docs/                  maqueta v13 y planilla Excel de referencia
```

Detalle técnico del front, reglas y contrato con la API: [`frontend/README.md`](frontend/README.md).

## Stack

Angular 22.2 · Angular Material 22 · TypeScript 6 · RxJS 7.8 · date-fns 4 · jsPDF · Vitest · ESLint

---

# Backend

API REST que consume el front. Se sirve detrás de Apache en `/api` y escucha solo en `127.0.0.1:3000`, así que no hace falta CORS (front y API comparten origen).

> **Estado:** esqueleto. Ya están la configuración, las utilidades, los modelos y la conexión a la base (`npm run db:verificar`). Falta la Etapa 0 (`app.js`, `server.js`, middlewares y rutas); hasta entonces `npm start` y `npm run dev` no levantan la API.

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | **24 LTS** (ver `.nvmrc`), el mismo del front |
| npm | 11 (viene con Node 24) |
| MySQL | **5.7** (la del servidor del Poder Judicial) |
| Cliente SQL | SQLyog u otro, para correr los scripts de `db/` |

## Base de datos

La base se llama `podjud_licencias`. Los scripts los corre un **usuario administrador**, en este orden (en SQLyog, **Ctrl+F9** para ejecutar el script entero):

| Script | Qué hace | Dónde |
|---|---|---|
| `db/001_schema.sql` | Crea la base y las 7 tablas | Todos los ambientes |
| `db/002_seed.sql` | Los 5 Colegios y los 3 tipos de licencia | Todos los ambientes |
| `db/003_usuario_app.sql` | Crea `licencias_app` con **SELECT, INSERT, UPDATE** (sin DELETE). Antes de correrlo, poner la clave y el host | Todos los ambientes |
| `db/pruebas/999_datos_de_prueba.sql` | 100.000 licencias de prueba | **Solo** desarrollo y preproducción |

**Usuario de la aplicación por IP.** `licencias_app` se habilita para la IP desde la que se conecta la API. En producción es `127.0.0.1` (la API y MySQL en el mismo servidor). En desarrollo, cada persona necesita uno para la IP de su PC, que se averigua conectado a MySQL con:

```sql
SELECT SUBSTRING_INDEX(USER(), '@', -1) AS mi_ip;
```

**Particularidades de MySQL 5.7** (ya resueltas en los scripts y en el código):

- Colación `utf8mb4_unicode_ci`: ignora tildes y mayúsculas ("garcia" encuentra "García").
- El servidor está en `latin1` y **sin modo estricto**. No se toca el servidor: la API pide `utf8mb4` y activa el modo estricto en cada conexión (`sequelize.js`).
- No hay `REGEXP_REPLACE`: `licencia.matricula_norm` la completa la API (hook del modelo). Si se escribe SQL a mano, calcularla igual que `normMatricula()`: minúsculas y solo letras y números.
- Los `CHECK` no se aplican en 5.7: esas reglas las valida la API.

> MySQL 5.7 está fuera de soporte desde octubre de 2023. Es un riesgo a informar al cliente; en esta entrega no se migra.

## Levantar el back

```bash
cd PJUD_Licencias_Abogados/backend
npm ci
cp .env.example .env        # y completar (ver abajo)
npm run db:verificar        # prueba la conexión y la base
npm run dev                 # disponible al terminar la Etapa 0
```

`npm run db:verificar` tiene que mostrar: conexión `utf8mb4`, modo estricto activo, 5 Colegios, 3 tipos y **DELETE denegado**. Lo que inserta para probar queda en una transacción que se deshace.

## Configuración (`backend/.env`)

Se copia de `.env.example`. **El `.env` no se commitea.** En el servidor va en `/etc/licencias/api.env` con permisos `600`. Si falta una variable obligatoria, la API no arranca y dice cuál.

| Variable | Ejemplo | Uso |
|---|---|---|
| `NODE_ENV` | `local` | `local`, `development`, `testing` o `production`. `/api-docs` solo existe en los tres primeros |
| `PORT` | `3000` | Puerto de la API (escucha en `127.0.0.1`) |
| `TRUST_PROXY` | `loopback` | Apache como proxy: necesario para ver la IP real en el límite de uso |
| `DB_HOST`, `DB_PORT` | `<host>`, `3306` | Servidor MySQL. Pedirlo al equipo: no va en el repositorio |
| `DB_NAME` | `podjud_licencias` | Esquema |
| `DB_USER`, `DB_PASS` | `licencias_app`, `…` | Usuario de la aplicación |
| `JWT_SECRET` | 96 caracteres hex | **Obligatorio**, mínimo 32 caracteres. Uno distinto por ambiente: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SESION_MINUTOS` | `30` | La sesión del contenidista vence tras ese tiempo sin uso |
| `SESION_COOKIE_SECURE` | `false` en local | `true` en cualquier ambiente con HTTPS |
| `OTP_MINUTOS`, `OTP_INTENTOS` | `10`, `5` | Vigencia e intentos del código por correo |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | | Correo para el OTP. **Sin `SMTP_HOST`** el correo no sale y se muestra en la consola (útil en local) |
| `THROTTLE_LIMIT` | `120` | Pedidos por minuto y por IP en la API |
| `THROTTLE_EXCLUIR_REDES` | vacío | Redes CIDR que no cuentan para el límite (por ejemplo, la salida NAT de los juzgados) |
| `CARGA_MASIVA` | `off` | `on` habilita la planilla y los lotes. Apagada, esas rutas dan 404 |
| `AVISO_REPETIDA` | `off` | Aviso de carga repetida (RN-04). El cliente no lo pidió para la primera versión |
| `METRICS_PORT` | `9405` | Métricas Prometheus en un puerto aparte |
| `API_DOCS_USUARIO`, `API_DOCS_PASSWORD_HASH`, `API_DOCS_REDES_INTERNAS` | | Acceso a `/api-docs`: libre desde las redes internas y con usuario y clave desde afuera |

## Comandos

Desde `backend/`:

| Comando | Qué hace |
|---|---|
| `npm run dev` | API con recarga automática (`node --watch`) |
| `npm start` | API sin recarga (la que usa el servicio en el servidor) |
| `npm test` | Pruebas (`node --test` + supertest) |
| `npm run db:verificar` | Verifica conexión, modo estricto, datos iniciales y permisos de la base |

## API

Prefijo `/api`, JSON, fechas `AAAA-MM-DD`. Documentación navegable en `/api-docs` (Swagger), fuera de producción.

| Área | Rutas | Acceso |
|---|---|---|
| Públicas | `GET /salud`, `GET /config`, `GET /colegios`, `GET /licencias` | Libre (con límite de uso) |
| Ingreso | `POST /auth/login`, `POST /auth/otp`, `POST /auth/logout` | Libre / sesión |
| Gestión | `GET /carga/tipos`, `GET /carga/licencias` (+ `/existe`, `/tope`), `POST /carga/licencias`, `PATCH /carga/licencias/:id`, `POST /carga/licencias/:id/anular` | Contenidista |
| Carga masiva | `GET /carga/plantilla`, `POST /carga/lotes/validar`, `GET /carga/lotes`, `GET /carga/lotes/:id/filas`, `GET /carga/lotes/:id/reporte-errores`, `POST /carga/lotes/:id/confirmar`, `POST /carga/lotes/:id/revertir` | Contenidista + `CARGA_MASIVA=on` |

- **Listas:** `{ items, total, page, size, pages }`. 10 por página por defecto, máximo 100. Si `page` se pasa, devuelve la última.
- **Errores:** siempre `{ "statusCode": 400, "message": ["…"], "error": "Solicitud inválida" }`, en español. Códigos: 400, 401, 403, 404, 409, 413, 422 (tope anual que bloquea) y 429.
- **Datos públicos:** las rutas públicas **nunca** devuelven el tipo de licencia, la observación ni las anuladas. Eso es solo de `/api/carga/*`.

## Sesión y seguridad (back)

- **Ingreso:** contraseña con bcrypt y código OTP de 6 dígitos por correo, con vencimiento e intentos limitados.
- **Sesión:** tabla `sesion` y cookie HttpOnly (`SameSite=Lax`, `Secure` fuera de local) con un JWT que solo lleva el id de la sesión. Vence a los 30 minutos sin uso. Salir la cierra en la base, así que una cookie copiada deja de servir.
- **CSRF:** el back emite la cookie `XSRF-TOKEN` y valida el header `X-XSRF-TOKEN` que manda el front en los pedidos que modifican datos (pendiente, Etapa 0).
- **Base:** el usuario de la aplicación no puede borrar. Anular y revertir son UPDATE: nada se borra.
- **Cabeceras de seguridad**, límite de uso por IP, validación estricta de parámetros (los campos de más dan 400) y orden de columnas con lista cerrada (nunca se arma SQL con texto del usuario).

## Despliegue

1. En el servidor: Node 24 y un usuario de sistema `licencias`.
2. Copiar `backend/` (sin `node_modules`, `.env`, `test/` ni `scripts/`) y correr `npm ci --omit=dev`.
3. Crear `/etc/licencias/api.env` con los valores reales, permisos `600`.
4. Correr la API como servicio que se reinicia solo (systemd, `ExecStart=/usr/bin/node server.js`). La plantilla va en `deploy/` (pendiente).
5. Apache reenvía `/api/` a `http://127.0.0.1:3000/api/` (ver el ejemplo de la sección del front).
6. Verificar: `curl https://<dominio>/api/salud` da 200 y `POST /api/carga/licencias` sin sesión da 401.
7. Copia de seguridad diaria con `mysqldump` (retención 14 días) y una antes de cada despliegue.

## Estructura

Sigue la de `CAS_Gestion_Usuarios_API`:

```
backend/
├─ app.js · server.js        app Express / listen en 127.0.0.1 (Etapa 0)
├─ sequelize.js              conexión (utf8mb4 + modo estricto) y asociaciones
├─ resources/configurations/config.js   única fuente de configuración (.env)
├─ models/                   colegio, tipo_licencia, usuario, sesion, licencia, lote_carga, lote_carga_fila
├─ routes/                   rutas, validaciones (express-validator) y documentación Swagger
├─ businessLayer/<modulo>/   lógica de cada área (auth, tipos, licencias, lotes)
├─ businessLayer/utils/      errores, validar, paginacion, texto, redes, rateLimiters, mailer
├─ middleware-security/      cabeceras, acceso a /api-docs, sesión y rol, interruptor de carga masiva
├─ monitoreo/                salud y métricas Prometheus
├─ scripts/                  verificar-db (y herramientas de desarrollo)
└─ test/                     node --test + supertest
db/                          scripts SQL (MySQL 5.7)
```

**Patrón:** la ruta valida y llama a la función del `businessLayer`, que usa los modelos y responde. Los errores se lanzan con los helpers de `businessLayer/utils/errores.js` y los atrapa un manejador único.

## Stack (back)

Node 24 · Express 5 · Sequelize 6 · mysql2 · MySQL 5.7 · express-validator · express-rate-limit · jsonwebtoken · bcryptjs · nodemailer · multer · exceljs · swagger-jsdoc · prom-client · node:test + supertest
