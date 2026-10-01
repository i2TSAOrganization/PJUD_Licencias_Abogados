# PJUD · Licencias de abogados

Sistema de consulta y carga de licencias especiales de abogados y procuradores del Poder Judicial de Santa Fe.

- **Consulta** (`/consulta`): libre, sin ingreso. Filtros, tabla ordenable y exportación a PDF.
- **Gestión** (`/carga`): solo para el contenidista. Alta individual y masiva por Excel, corrección y anulación.

Este repositorio contiene el **frontend** (`frontend/`). El backend se desarrolla aparte.

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
