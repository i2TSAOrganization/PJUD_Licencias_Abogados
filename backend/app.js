'use strict';

// La aplicación Express, sin escuchar en ningún puerto: la levanta server.js
// y la usan los tests con supertest. Orden de middlewares tomado de CAS.

const express = require('express');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const config = require('./resources/configurations/config.js');
const swaggerSpec = require('./swagger');
const { securityHeaders } = require('./middleware-security/middleware-security-headers');
const { crearApiDocsAuth } = require('./middleware-security/api-docs-auth');
const { csrf } = require('./middleware-security/csrf');
const { httpDuration } = require('./monitoreo/metrics');
const { limiteGeneral } = require('./businessLayer/utils/rateLimiters');
const { rutaInexistente, manejadorErrores } = require('./businessLayer/utils/manejadorErrores');
const rutas = require('./routes');

const AMBIENTES_CON_API_DOCS = ['local', 'development', 'testing'];

const app = express();

// Detrás de Apache: sin esto el límite de uso vería una sola IP (la del proxy)
app.set('trust proxy', /^\d+$/.test(String(config.trustProxy)) ? Number(config.trustProxy) : config.trustProxy);
app.disable('x-powered-by');

// Security headers, primero de todos los middlewares
app.use(securityHeaders);

// Latencia de todas las rutas (prom-client)
app.use(function (req, res, next) {
    const end = httpDuration.startTimer();
    res.on('finish', function () {
        end({ method: req.method, route: req.route ? req.baseUrl + req.route.path : 'sin_ruta', status_code: res.statusCode });
    });
    next();
});

// Sin CORS: Apache sirve el front y la API en el mismo origen
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

if (AMBIENTES_CON_API_DOCS.includes(config.enviroment)) {
    app.use('/api-docs', crearApiDocsAuth(config), swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`Swagger UI habilitado en /api-docs (ambiente: ${config.enviroment})`);
} else {
    console.log(`Swagger UI deshabilitado (ambiente: ${config.enviroment})`);
}

app.use('/api', limiteGeneral, csrf, rutas);

app.use(rutaInexistente);
app.use(manejadorErrores);

module.exports = app;
