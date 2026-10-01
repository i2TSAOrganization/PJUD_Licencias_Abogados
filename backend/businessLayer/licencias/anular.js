'use strict';

// POST /api/carga/licencias/:id/anular
// Dueño: Meka. Anula una licencia activa (CU-05). 404 si no existe o ya está anulada. Ver PDF v2, 5.4.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.anular = pendiente('POST /api/carga/licencias/:id/anular');
