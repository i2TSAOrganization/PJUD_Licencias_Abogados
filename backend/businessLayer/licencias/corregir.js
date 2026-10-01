'use strict';

// PATCH /api/carga/licencias/:id
// Dueño: Matías. Corregir (CU-04): mismas reglas que el alta, sin contarse a sí misma en el tope.
// Hasta implementarlo responde 501 (pendiente).

const { pendiente } = require('../utils/errores');

exports.corregir = pendiente('PATCH /api/carga/licencias/:id');
