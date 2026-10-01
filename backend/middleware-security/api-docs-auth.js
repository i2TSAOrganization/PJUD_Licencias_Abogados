/**
 * ============================================
 * MIDDLEWARE: Acceso a la documentación Swagger
 * ============================================
 * Igual que en CAS_Gestion_Usuarios_API: desde las redes internas se entra
 * directo; desde afuera, con usuario y clave (Basic Auth, clave en sha256).
 */

'use strict';

const crypto = require('crypto');
const { construirRedes, ipEnRedes, normalizarIP } = require('../businessLayer/utils/redes');

function comparacionSegura(recibido, esperado) {
    const hashRecibido = crypto.createHash('sha256').update(String(recibido), 'utf8').digest();
    const hashEsperado = crypto.createHash('sha256').update(String(esperado), 'utf8').digest();
    return crypto.timingSafeEqual(hashRecibido, hashEsperado);
}

function hashearPassword(password) {
    return crypto.createHash('sha256').update(String(password), 'utf8').digest('hex');
}

function pedirCredenciales(res) {
    res.set('WWW-Authenticate', 'Basic realm="Documentacion API", charset="UTF-8"');
    res.set('Cache-Control', 'no-store');
    return res.status(401).send('Acceso no autorizado.');
}

function parsearCredenciales(headerAuthorization) {
    if (typeof headerAuthorization !== 'string' || !headerAuthorization.startsWith('Basic ')) {
        return null;
    }
    const decodificado = Buffer.from(headerAuthorization.slice(6).trim(), 'base64').toString('utf8');
    const separador = decodificado.indexOf(':');
    if (separador === -1) return null;
    return {
        usuario: decodificado.slice(0, separador),
        password: decodificado.slice(separador + 1),
    };
}

function crearApiDocsAuth(config) {
    const apiDocsConfig = (config && config.apiDocs) || {};
    const USUARIO = apiDocsConfig.usuario;
    const PASSWORD_HASH = apiDocsConfig.passwordHash;
    const REDES = construirRedes(apiDocsConfig.redesInternas, 'API-DOCS');
    const HAY_CREDENCIALES = Boolean(USUARIO && PASSWORD_HASH);

    if (REDES) {
        console.log(`[API-DOCS] Acceso directo habilitado para: ${apiDocsConfig.redesInternas.join(', ')}`);
    } else {
        console.log('[API-DOCS] Sin redes internas configuradas — se pide usuario y clave a todos');
    }

    return function apiDocsAuth(req, res, next) {
        if (ipEnRedes(REDES, req.ip)) {
            return next();
        }

        const ip = normalizarIP(req.ip);
        if (!HAY_CREDENCIALES) {
            console.warn(`API-DOCS: acceso externo rechazado desde ${ip} — no hay credenciales configuradas`);
            res.set('Cache-Control', 'no-store');
            return res.status(503).send('Documentación no disponible: falta configurar el acceso.');
        }

        const credenciales = parsearCredenciales(req.headers['authorization']);
        if (!credenciales) {
            return pedirCredenciales(res);
        }

        const usuarioOk = comparacionSegura(credenciales.usuario, USUARIO);
        const passwordOk = comparacionSegura(hashearPassword(credenciales.password), String(PASSWORD_HASH).toLowerCase());
        if (usuarioOk && passwordOk) {
            return next();
        }

        console.warn(`API-DOCS: intento de acceso fallido desde ${ip}`);
        return pedirCredenciales(res);
    };
}

module.exports = { crearApiDocsAuth, hashearPassword };
