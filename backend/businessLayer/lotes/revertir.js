'use strict';

// POST /api/carga/lotes/:id/revertir
// Dueño: Meka. En transacción: 404/409, anula las licencias activas del lote y lo marca REVERTIDO. Devuelve el Lote. Ver PDF v2, 5.6.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.revertir = pendiente('POST /api/carga/lotes/:id/revertir');
