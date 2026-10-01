'use strict';

// GET /api/carga/lotes
// Dueño: Meka. Lotes CONFIRMADO o REVERTIDO, paginados, con la forma Lote del front (usar loteDto de lotes/dto.js). Ver PDF v2, 5.5.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.listar = pendiente('GET /api/carga/lotes');
