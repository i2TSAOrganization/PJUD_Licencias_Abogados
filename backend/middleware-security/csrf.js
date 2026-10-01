/**
 * ============================================
 * MIDDLEWARE: protección CSRF (doble cookie)
 * ============================================
 * El front usa el soporte de Angular (withXsrfConfiguration): lee la cookie
 * XSRF-TOKEN y la manda en el header X-XSRF-TOKEN en cada POST/PATCH.
 *  - Si el pedido no trae la cookie, se emite una nueva (no HttpOnly: Angular tiene que leerla).
 *  - En los métodos que modifican datos, header y cookie tienen que coincidir.
 * Un sitio ajeno puede hacer que el navegador mande la cookie, pero no puede leerla
 * para copiarla en el header.
 */

'use strict';

const crypto = require('crypto');
const config = require('../resources/configurations/config.js');
const { cuerpoError } = require('../businessLayer/utils/errores');

const COOKIE = 'XSRF-TOKEN';
const HEADER = 'x-xsrf-token';
const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

function iguales(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function csrf(req, res, next) {
    const cookie = req.cookies?.[COOKIE];

    if (!cookie) {
        res.cookie(COOKIE, crypto.randomBytes(32).toString('hex'), {
            httpOnly: false,
            sameSite: 'lax',
            secure: config.sesion.cookieSecure,
            path: '/',
        });
    }

    if (METODOS_SEGUROS.has(req.method)) return next();

    const header = req.get(HEADER);
    if (cookie && header && iguales(cookie, header)) return next();

    console.warn(`CSRF: rechazado ${req.method} ${req.originalUrl} desde ${req.ip}`);
    return res.status(403).json(cuerpoError(403, 'Token de seguridad inválido. Recargue la página e intente de nuevo.'));
}

module.exports = { csrf, COOKIE_CSRF: COOKIE, HEADER_CSRF: HEADER };
