'use strict';

// Cuerpo de error único para toda la API (sección 4.4 del modelado):
//   { "statusCode": 400, "message": ["..."], "error": "Solicitud inválida" }
// "message" es una lista en los 400 de validación y un texto en el resto.
// Todos los textos en español: la pantalla los muestra tal cual.

const NOMBRES = {
    400: 'Solicitud inválida',
    401: 'No autenticado',
    403: 'Sin permiso',
    404: 'No encontrado',
    409: 'Conflicto',
    413: 'Archivo demasiado grande',
    422: 'No se puede procesar',
    429: 'Demasiadas solicitudes',
    500: 'Error interno',
    501: 'No implementado',
    503: 'Servicio no disponible',
};

class HttpError extends Error {
    constructor(status, message) {
        super(Array.isArray(message) ? message.join('; ') : message);
        this.status = status;
        this.mensaje = message;
    }
}

function cuerpoError(status, message) {
    return { statusCode: status, message, error: NOMBRES[status] || 'Error' };
}

const badRequest = (m) => new HttpError(400, m);
const unauthorized = (m = 'Se requiere iniciar sesión') => new HttpError(401, m);
const forbidden = (m = 'No tiene permiso para esta acción') => new HttpError(403, m);
const notFound = (m = 'No encontrado') => new HttpError(404, m);
const conflict = (m) => new HttpError(409, m);
const unprocessable = (m) => new HttpError(422, m);

/** Marca de lo que todavía no se construyó. Responde 501 con el CU o la regla que falta. */
function pendiente(referencia) {
    return function (req, res) {
        throw new HttpError(501, `Pendiente de implementar: ${referencia}`);
    };
}

module.exports = {
    HttpError,
    cuerpoError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    unprocessable,
    pendiente,
};
