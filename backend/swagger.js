'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const config = require('./resources/configurations/config.js');

// Esquemas = interfaces del front (frontend/src/app/interfaces). Si cambia una, cambia la otra.
const schemas = {
    Error: {
        type: 'object',
        properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
            error: { type: 'string', example: 'Solicitud inválida' },
        },
    },
    Usuario: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 3 },
            usuario: { type: 'string', example: 'jperez' },
            nombre: { type: 'string', example: 'Juana Pérez' },
            rol: { type: 'string', example: 'contenidista' },
        },
    },
    TipoLicencia: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            codigo: { type: 'string', example: 'FALL' },
            nombre: { type: 'string', example: 'Fallecimiento de familiar directo' },
            diasHabiles: { type: 'integer', nullable: true, example: 3, description: 'null = «Otro (días a mano)»' },
            maximoAnual: { type: 'integer', nullable: true, example: 3 },
            bloqueaTope: { type: 'boolean', example: false },
        },
    },
    LicenciaPublica: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 412 },
            colegio: {
                type: 'object',
                properties: { id: { type: 'integer' }, nombre: { type: 'string' }, circunscripcion: { type: 'integer' } },
                example: { id: 2, nombre: 'Rosario', circunscripcion: 2 },
            },
            apellidoNombre: { type: 'string', example: 'ALCARAZ, Sofía' },
            matricula: { type: 'string', example: 'R-4412' },
            tipoProfesional: { type: 'string', enum: ['A', 'P'] },
            fechaComienzo: { type: 'string', format: 'date', example: '2026-10-13' },
            diasHabiles: { type: 'integer', example: 5 },
        },
    },
    LicenciaCarga: {
        allOf: [
            { $ref: '#/components/schemas/LicenciaPublica' },
            {
                type: 'object',
                properties: {
                    tipo: { type: 'object', properties: { id: { type: 'integer' }, nombre: { type: 'string' } }, example: { id: 3, nombre: 'Otro (días a mano)' } },
                    observacion: { type: 'string', nullable: true },
                    anulada: { type: 'boolean' },
                    loteNumero: { type: 'string', nullable: true, example: '2026-10-09-01' },
                },
            },
        ],
    },
    LicenciaRequest: {
        type: 'object',
        required: ['colegioId', 'apellidoNombre', 'matricula', 'tipoProfesional', 'fechaComienzo', 'tipoLicenciaId'],
        properties: {
            colegioId: { type: 'integer', example: 2 },
            apellidoNombre: { type: 'string', example: 'ALCARAZ, Sofía', description: 'Formato «APELLIDO, Nombre»' },
            matricula: { type: 'string', example: 'R-4412' },
            tipoProfesional: { type: 'string', enum: ['A', 'P'] },
            fechaComienzo: { type: 'string', format: 'date', example: '2026-10-13' },
            tipoLicenciaId: { type: 'integer', example: 3 },
            diasHabiles: { type: 'integer', nullable: true, example: 5, description: 'Solo cuenta si el tipo no tiene días fijos' },
            observacion: { type: 'string', nullable: true, example: 'Licencia por capacitación' },
        },
    },
    Pagina: {
        type: 'object',
        properties: {
            items: { type: 'array', items: {} },
            total: { type: 'integer', example: 294 },
            page: { type: 'integer', example: 1 },
            size: { type: 'integer', example: 10 },
            pages: { type: 'integer', example: 30 },
        },
    },
    ControlCarga: {
        type: 'object',
        properties: {
            repetida: {
                type: 'object', nullable: true,
                properties: { id: { type: 'integer' }, apellidoNombre: { type: 'string' }, diasHabiles: { type: 'integer' } },
            },
            tope: {
                type: 'object', nullable: true,
                properties: {
                    anio: { type: 'integer', example: 2026 },
                    tipoNombre: { type: 'string', example: 'Fallecimiento de familiar directo' },
                    acumulado: { type: 'integer', example: 3 },
                    total: { type: 'integer', example: 6 },
                    maximo: { type: 'integer', example: 3 },
                    bloquea: { type: 'boolean', example: false },
                },
            },
        },
    },
    Lote: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 7 },
            numero: { type: 'string', example: '2026-10-09-01' },
            archivo: { type: 'string', example: 'licencias_oct.xlsx' },
            creadoEn: { type: 'string', example: '2026-10-09T10:15:00' },
            cantidad: { type: 'integer', example: 51 },
            activas: { type: 'integer', example: 49 },
            revertido: { type: 'boolean', example: false },
        },
    },
};

// Parámetros comunes de las dos listas de licencias
const parameters = {
    nombre: { in: 'query', name: 'nombre', schema: { type: 'string' }, description: 'Cada palabra debe aparecer (sin distinguir tildes ni mayúsculas)' },
    matricula: { in: 'query', name: 'matricula', schema: { type: 'string' }, description: 'Coincidencia parcial, ignora puntuación y espacios' },
    tipoProfesional: { in: 'query', name: 'tipoProfesional', schema: { type: 'string', enum: ['A', 'P'] } },
    colegioId: { in: 'query', name: 'colegioId', schema: { type: 'integer' } },
    fecha: { in: 'query', name: 'fecha', schema: { type: 'string', format: 'date' }, description: 'Fecha de comienzo exacta (AAAA-MM-DD)' },
    dias: { in: 'query', name: 'dias', schema: { type: 'integer' }, description: 'Cantidad de días hábiles exacta' },
    dir: { in: 'query', name: 'dir', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
    page: { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
    size: { in: 'query', name: 'size', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
};

const responses = {
    Invalido: { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    SinSesion: { description: 'Sin sesión o sesión vencida', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    SinPermiso: { description: 'Sin rol de contenidista, o falta el header X-XSRF-TOKEN', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    NoExiste: { description: 'No existe (o la carga masiva está apagada)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    Pendiente: { description: 'Todavía no implementado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Licencias de abogados y procuradores · API',
            version: '1.0.0',
            description: 'API del registro de licencias del Poder Judicial de Santa Fe. ' +
                'Las rutas de /api/carga requieren la sesión del contenidista (cookie) y, ' +
                'en POST/PATCH, el header X-XSRF-TOKEN con el valor de la cookie XSRF-TOKEN.',
        },
        // Ruta relativa: funciona igual en local (puerto propio) y detrás de Apache
        servers: [{ url: '/' }],
        components: {
            securitySchemes: {
                cookieSesion: { type: 'apiKey', in: 'cookie', name: config.sesion.cookieNombre },
                csrf: { type: 'apiKey', in: 'header', name: 'X-XSRF-TOKEN' },
            },
            schemas,
            parameters,
            responses,
        },
    },
    // Con barras "/": en Windows el patrón con "\" no encuentra archivos
    apis: [path.join(__dirname, 'routes', '*.js'), path.join(__dirname, 'monitoreo', 'health.js')]
        .map((p) => p.replace(/\\/g, '/')),
};

module.exports = swaggerJsdoc(options);
