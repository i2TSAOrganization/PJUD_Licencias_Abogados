'use strict';

// POST /api/auth/logout
// Dueño: Meka. Idempotente: cierra la sesión si obtenerSid(req) la encuentra (cerrarSesion) y siempre limpiarCookieSesion(res). Responde { ok: true }. Ver PDF v2, 5.2.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.salir = pendiente('POST /api/auth/logout');
