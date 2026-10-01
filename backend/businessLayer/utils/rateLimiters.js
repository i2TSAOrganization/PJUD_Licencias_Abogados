'use strict';

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('../../resources/configurations/config.js');
const { cuerpoError } = require('./errores');
const { construirRedes, ipEnRedes } = require('./redes');

const VENTANA_1_MIN = 60 * 1000;
const VENTANA_15_MIN = 15 * 60 * 1000;

const opcionesBase = {
    standardHeaders: 'draft-7',
    legacyHeaders: false,
};

function construirHandler(mensaje) {
    return function (req, res, next, options) {
        console.warn(`RATE-LIMIT: bloqueado ${req.method} ${req.originalUrl} desde ${req.ip}`);
        return res.status(options.statusCode).json(cuerpoError(429, mensaje));
    };
}

function clavePorCuenta(req) {
    const usuario = typeof req.body?.usuario === 'string' ? req.body.usuario.trim().toLowerCase() : '';
    return usuario ? `cuenta:${usuario}` : ipKeyGenerator(req.ip);
}

const redesExcluidas = construirRedes(config.throttleExcluirRedes, 'THROTTLE');
if (redesExcluidas) {
    console.log(`[THROTTLE] Redes excluidas del límite de uso: ${config.throttleExcluirRedes.join(', ')}`);
}

/**
 * Límite general de /api: THROTTLE_LIMIT pedidos por minuto y por IP (sección 4.6).
 * Detrás de Apache depende de trust proxy para ver la IP real.
 */
const limiteGeneral = rateLimit({
    ...opcionesBase,
    windowMs: VENTANA_1_MIN,
    limit: config.throttleLimit,
    skip: (req) => ipEnRedes(redesExcluidas, req.ip),
    handler: construirHandler('Demasiadas consultas. Espere un minuto y vuelva a intentar.'),
});

/** POST /api/auth/login — por IP. */
const intentoLoginPorIP = rateLimit({
    ...opcionesBase,
    windowMs: VENTANA_15_MIN,
    limit: 10,
    handler: construirHandler('Demasiados intentos de ingreso. Aguarde 15 minutos antes de volver a intentar.'),
});

/** POST /api/auth/login — por cuenta, contra quien rota IPs. */
const intentoLoginPorCuenta = rateLimit({
    ...opcionesBase,
    windowMs: VENTANA_15_MIN,
    limit: 5,
    keyGenerator: clavePorCuenta,
    handler: construirHandler('Demasiados intentos de ingreso para este usuario. Aguarde 15 minutos antes de volver a intentar.'),
});

/** POST /api/auth/otp — defensa contra la fuerza bruta del código. */
const intentoOtp = rateLimit({
    ...opcionesBase,
    windowMs: VENTANA_15_MIN,
    limit: 10,
    handler: construirHandler('Demasiados intentos con el código. Aguarde 15 minutos antes de volver a intentar.'),
});

module.exports = { limiteGeneral, intentoLoginPorIP, intentoLoginPorCuenta, intentoOtp };
