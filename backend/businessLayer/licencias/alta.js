'use strict';

// POST /api/carga/licencias
// Dueño: Matías. Alta (CU-03): reglas del tipo, tope (422 si bloquea), en transacción.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.crear = pendiente('POST /api/carga/licencias');
