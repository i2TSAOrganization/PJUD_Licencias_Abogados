'use strict';

const path = require('path');

// El .env vive en la raíz del backend (dos niveles arriba de
// resources/configurations/). Se resuelve desde __dirname y NUNCA desde
// process.cwd(), así da lo mismo desde dónde se invoque "node" (systemd,
// una prueba manual, etc). process.env.ENV_FILE permite apuntar a otro
// archivo (lo usa test/config.test.js).
require('dotenv').config({
    path: process.env.ENV_FILE || path.resolve(__dirname, '..', '..', '.env'),
    quiet: true,
});

function required(name) {
    const value = process.env[name];
    if (value === undefined || value === null || value === '') {
        throw new Error(
            `Falta la variable de entorno obligatoria: ${name}\n` 
        );
    }
    return value;
}

function optional(name, consecuencia) {
    const value = process.env[name];
    if (value === undefined || value === null || value === '') {
        console.warn(`[CONFIG] Falta ${name} en .env — ${consecuencia}`);
    }
    return value;
}

function int(name, def) {
    const value = process.env[name];
    if (value === undefined || value === '') return def;
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) throw new Error(`La variable ${name} debe ser un número entero (vino "${value}")`);
    return n;
}

function bool(name, def) {
    const value = process.env[name];
    if (value === undefined || value === '') return def;
    return ['true', '1', 'on', 'si'].includes(value.toLowerCase());
}

function list(name, def) {
    const value = process.env[name];
    if (!value) return def;
    return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function secreto(name, minimo) {
    const value = required(name);
    if (value.length < minimo) {
        throw new Error(`${name} debe tener al menos ${minimo} caracteres. Generar uno con: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
    }
    return value;
}

const enviroment = process.env.NODE_ENV || 'development';

module.exports = {
    enviroment,
    port: int('PORT', 3000),
    // Detrás de Apache: necesario para que el límite de uso vea la IP real.
    trustProxy: process.env.TRUST_PROXY || 'loopback',
    stacktraces: bool('STACKTRACES', enviroment !== 'production'),

    db: {
        host: required('DB_HOST'),
        port: int('DB_PORT', 3306),
        database: required('DB_NAME'),
        user: required('DB_USER'),
        password: required('DB_PASS'),
        poolMax: int('DB_POOL_MAX', 10),
        logging: bool('DB_LOGGING', false),
    },

    sesion: {
        jwtSecret: secreto('JWT_SECRET', 32),
        // RN-11: la sesión vence por inactividad. Se renueva en cada pedido autenticado.
        minutosInactividad: int('SESION_MINUTOS', 30),
        cookieNombre: process.env.SESION_COOKIE || 'licencias_sesion',
        // Solo se apaga en local (http sin Apache). En cualquier otro ambiente va Secure.
        cookieSecure: bool('SESION_COOKIE_SECURE', enviroment !== 'local'),
    },

    otp: {
        minutos: int('OTP_MINUTOS', 10),
        intentos: int('OTP_INTENTOS', 5),
    },

    correo: {
        host: optional('SMTP_HOST', 'no se van a poder enviar los códigos OTP'),
        port: int('SMTP_PORT', 25),
        secure: bool('SMTP_SECURE', false),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.MAIL_FROM || 'Licencias de abogados <no-responder@justiciasantafe.gov.ar>',
    },

    // Pedidos por minuto y por IP para la consulta pública (sección 4.6 del modelado).
    throttleLimit: int('THROTTLE_LIMIT', 120),
    // Redes que no cuentan para el límite (por ejemplo, la salida NAT de los juzgados). Vacío = nadie se excluye.
    throttleExcluirRedes: list('THROTTLE_EXCLUIR_REDES', []),

    // Apagada por defecto: sale el 13/10 sin ella y se enciende cambiando la variable.
    // Apagada, /api/carga/lotes y /api/carga/plantilla responden 404.
    cargaMasiva: bool('CARGA_MASIVA', false),
    // RN-04: aviso de carga repetida. Apagado: "se carga lo que informa" el Colegio (cliente, 01/10).
    avisoRepetida: bool('AVISO_REPETIDA', false),

    metricsPort: int('METRICS_PORT', 9405),

    apiDocs: {
        passwordHash: optional('API_DOCS_PASSWORD_HASH', 'la documentación Swagger no va a ser accesible fuera de la red interna'),
        usuario: process.env.API_DOCS_USUARIO || 'docs',
        redesInternas: list('API_DOCS_REDES_INTERNAS', [
            '127.0.0.1/32',
            '::1/128',
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
        ]),
    },
};
