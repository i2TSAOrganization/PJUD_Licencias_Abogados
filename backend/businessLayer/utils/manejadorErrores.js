'use strict';

const config = require('../../resources/configurations/config.js');
const { HttpError, cuerpoError } = require('./errores');

/** Ruta inexistente: 404 con el cuerpo de error común. */
function rutaInexistente(req, res) {
    res.status(404).json(cuerpoError(404, `La ruta ${req.method} ${req.path} no existe`));
}

/**
 * Manejador único de errores. Todo lo que se lanza en una ruta (en Express 5
 * también los rechazos de funciones async) termina acá y sale con
 * { statusCode, message, error }. Los errores inesperados no muestran detalles.
 */
function manejadorErrores(err, req, res, next) {
    if (res.headersSent) return next(err);

    if (err instanceof HttpError) {
        return res.status(err.status).json(cuerpoError(err.status, err.mensaje));
    }

    // express.json(): cuerpo mal formado o demasiado grande
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json(cuerpoError(400, 'El cuerpo de la solicitud no es un JSON válido'));
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json(cuerpoError(413, 'El cuerpo de la solicitud es demasiado grande'));
    }

    // multer (carga masiva)
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json(cuerpoError(413, 'El archivo supera el tamaño máximo de 1 MB'));
        }
        return res.status(400).json(cuerpoError(400, 'El archivo no es válido: envíe un único archivo en el campo "archivo"'));
    }

    // Base de datos caída o inaccesible
    if (/^Sequelize(Connection|ConnectionRefused|HostNotFound|HostNotReachable|ConnectionTimedOut|AccessDenied)Error$/.test(err.name)) {
        console.error(`DB: ${req.method} ${req.originalUrl} -> ${err.message}`);
        return res.status(503).json(cuerpoError(503, 'La base de datos no está disponible. Intente más tarde'));
    }

    console.error(`ERROR: ${req.method} ${req.originalUrl} -> ${err.message}`);
    if (config.stacktraces) console.error(err.stack);
    return res.status(500).json(cuerpoError(500, 'Ocurrió un error interno. Intente más tarde'));
}

module.exports = { rutaInexistente, manejadorErrores };
