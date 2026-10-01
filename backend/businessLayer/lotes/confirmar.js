'use strict';

// POST /api/carga/lotes/:token/confirmar
// Dueño: Matías. En transacción: inserta las filas OK y con aviso y numera el lote. Responde ConfirmacionLote.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.confirmar = pendiente('POST /api/carga/lotes/:token/confirmar');
