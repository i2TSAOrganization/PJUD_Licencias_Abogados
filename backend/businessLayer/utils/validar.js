'use strict';

const { validationResult } = require('express-validator');
const { cuerpoError } = require('./errores');

/**
 * Cierra una cadena de express-validator: si hubo errores responde 400 con la
 * lista de mensajes. Los datos ya validados se leen con matchedData(req)
 * (en Express 5 req.query es de solo lectura y los sanitizers no lo modifican).
 */
function validar(req, res, next) {
    const resultado = validationResult(req);
    if (resultado.isEmpty()) return next();
    const mensajes = [...new Set(resultado.array().map((e) => e.msg))];
    return res.status(400).json(cuerpoError(400, mensajes));
}

/**
 * Rechaza campos que no estén en la lista (equivalente a forbidNonWhitelisted).
 * ubicacion: 'body' o 'query'.
 */
function soloCampos(ubicacion, permitidos) {
    return function (req, res, next) {
        const fuente = req[ubicacion] || {};
        const sobran = Object.keys(fuente).filter((k) => !permitidos.includes(k));
        if (!sobran.length) return next();
        return res.status(400).json(cuerpoError(400, sobran.map((k) => `El campo ${k} no está permitido`)));
    };
}

module.exports = { validar, soloCampos };
