/**
 * ============================================
 * MIDDLEWARE: interruptor de la carga masiva
 * ============================================
 * Con CARGA_MASIVA=off la planilla y los lotes responden 404, como si no existieran.
 * Así se puede salir a producción sin la carga masiva y encenderla cambiando la variable.
 */

'use strict';

const config = require('../resources/configurations/config.js');
const { notFound } = require('../businessLayer/utils/errores');

function cargaMasiva(req, res, next) {
    if (!config.cargaMasiva) throw notFound('La carga masiva no está habilitada');
    next();
}

module.exports = { cargaMasiva };
