'use strict';

// POST /api/auth/login
// Dueño: Matías. Usuario y clave (bcrypt) y envío del OTP. Responde LoginResponse { otpEnviado, destino }.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.ingresar = pendiente('POST /api/auth/login');
