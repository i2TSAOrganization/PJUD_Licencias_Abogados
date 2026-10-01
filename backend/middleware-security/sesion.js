/**
 * ============================================
 * MIDDLEWARE: sesión del contenidista
 * ============================================
 * La sesión vive en la tabla `sesion` (revocable del lado del servidor).
 * La cookie HttpOnly lleva un JWT que solo contiene el id de la sesión (sid):
 * el JWT prueba que el id lo emitió esta API; si la sesión sigue abierta lo dice la base.
 *  - Vence por inactividad (RN-11): SESION_MINUTOS sin pedidos.
 *  - Salir la cierra (cerrada_en): una cookie copiada deja de servir.
 * Nunca se borra una sesión: se cierra.
 */

'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../resources/configurations/config.js');
const { Sesion } = require('../sequelize');
const { unauthorized, forbidden } = require('../businessLayer/utils/errores');

const COOKIE = config.sesion.cookieNombre;
const INACTIVIDAD_MS = config.sesion.minutosInactividad * 60 * 1000;
// Para no escribir en la base en cada pedido: ultimo_uso se renueva como mucho una vez por minuto
const RENOVAR_CADA_MS = 60 * 1000;
// Vida máxima del JWT, aunque la sesión se use sin parar: obliga a ingresar de nuevo cada día
const VIDA_MAXIMA_JWT = '12h';

const OPCIONES_COOKIE = {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.sesion.cookieSecure,
    path: '/',
};

/** Firma el JWT de la sesión y lo deja en la cookie. */
function crearCookieSesion(res, sid) {
    const token = jwt.sign({ sid }, config.sesion.jwtSecret, { algorithm: 'HS256', expiresIn: VIDA_MAXIMA_JWT });
    res.cookie(COOKIE, token, OPCIONES_COOKIE);
}

/** Borra la cookie de sesión (mismas opciones con que se creó, si no el navegador no la borra). */
function limpiarCookieSesion(res) {
    res.clearCookie(COOKIE, OPCIONES_COOKIE);
}

/** Id de la sesión que trae la cookie, si el JWT es válido. No consulta la base. */
function obtenerSid(req) {
    const token = req.cookies?.[COOKIE];
    if (!token) return null;
    try {
        const payload = jwt.verify(token, config.sesion.jwtSecret, { algorithms: ['HS256'] });
        return typeof payload.sid === 'string' ? payload.sid : null;
    } catch (error) {
        return null;
    }
}

/** Abre una sesión nueva para el usuario y deja la cookie. La usa el ingreso con OTP. */
async function abrirSesion(res, usuarioId, ip) {
    const sesion = await Sesion.create({ id: crypto.randomUUID(), usuarioId, ip: ip ? String(ip).slice(0, 45) : null });
    crearCookieSesion(res, sesion.id);
    return sesion;
}

/** Cierra la sesión en la base (si estaba abierta). */
async function cerrarSesion(sid) {
    await Sesion.update({ cerradaEn: new Date() }, { where: { id: sid, cerradaEn: null } });
}

/**
 * Exige una sesión abierta y vigente. Deja:
 *   req.user     = { id, usuario, nombre, rol }
 *   req.sesionId = id de la sesión
 */
async function requireSesion(req, res, next) {
    const sid = obtenerSid(req);
    if (!sid) throw unauthorized();

    const sesion = await Sesion.findByPk(sid, { include: [{ association: 'usuario' }] });
    if (!sesion || sesion.cerradaEn) {
        limpiarCookieSesion(res);
        throw unauthorized('La sesión terminó. Ingrese de nuevo');
    }

    const inactiva = Date.now() - new Date(sesion.ultimoUso).getTime();
    if (inactiva > INACTIVIDAD_MS) {
        await cerrarSesion(sid);
        limpiarCookieSesion(res);
        throw unauthorized('La sesión venció por inactividad. Ingrese de nuevo');
    }

    // Un usuario dado de baja pierde la sesión en el próximo pedido
    if (!sesion.usuario || !sesion.usuario.activo) {
        await cerrarSesion(sid);
        limpiarCookieSesion(res);
        throw unauthorized();
    }

    if (inactiva > RENOVAR_CADA_MS) {
        await sesion.update({ ultimoUso: new Date() });
    }

    const u = sesion.usuario;
    req.user = { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol };
    req.sesionId = sid;
    next();
}

/** Exige uno de los roles indicados. Va siempre después de requireSesion. */
function requireRol(...roles) {
    return function (req, res, next) {
        if (!req.user || !roles.includes(req.user.rol)) throw forbidden();
        next();
    };
}

module.exports = {
    requireSesion,
    requireRol,
    abrirSesion,
    cerrarSesion,
    crearCookieSesion,
    limpiarCookieSesion,
    obtenerSid,
    COOKIE_SESION: COOKIE,
};
