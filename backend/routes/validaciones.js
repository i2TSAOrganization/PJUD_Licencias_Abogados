'use strict';

// Validaciones de express-validator que comparten varias rutas.
// Los mensajes son los que ve el contenidista: en español y concretos.
// Los BL leen lo validado con matchedData(req) (Express 5: req.query es de solo lectura).

const { query, body, param } = require('express-validator');
const { validadoresPagina } = require('../businessLayer/utils/paginacion');
const { soloCampos } = require('../businessLayer/utils/validar');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
// Valor vacío (el front no los manda, pero curl o Postman sí): se toma como ausente
const opcional = { values: 'falsy' };

/** AAAA-MM-DD y además una fecha que exista (rechaza 2026-02-30). */
function esFechaValida(valor) {
    if (!FECHA.test(String(valor))) return false;
    const d = new Date(`${valor}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

/** Orden por columna (RN-30): lista cerrada. 'tipoLicencia' solo en Gestión (dato sensible). */
const ORDEN_PUBLICO = ['colegio', 'nombre', 'matricula', 'tipoProfesional', 'fechaComienzo', 'diasHabiles'];
const ORDEN_GESTION = [...ORDEN_PUBLICO, 'tipoLicencia'];

const CAMPOS_LISTA = ['nombre', 'matricula', 'tipoProfesional', 'colegioId', 'fecha', 'dias', 'sort', 'dir', 'page', 'size'];

/** Filtros, orden y paginación de GET /api/licencias (publica) y GET /api/carga/licencias (gestion). */
function validadoresLista(modo) {
    const gestion = modo === 'gestion';
    return [
        soloCampos('query', gestion ? [...CAMPOS_LISTA, 'vigentes'] : CAMPOS_LISTA),
        query('nombre').optional(opcional).isString().trim().isLength({ max: 120 })
            .withMessage('El nombre puede tener hasta 120 caracteres'),
        query('matricula').optional(opcional).isString().trim().isLength({ max: 40 })
            .withMessage('La matrícula puede tener hasta 40 caracteres'),
        query('tipoProfesional').optional(opcional).isIn(['A', 'P'])
            .withMessage('El tipo de profesional debe ser A (Abogado/a) o P (Procurador/a)'),
        query('colegioId').optional(opcional).isInt({ min: 1 }).withMessage('El Colegio no es válido').toInt(),
        query('fecha').optional(opcional).custom(esFechaValida)
            .withMessage('La fecha de comienzo debe ser una fecha válida con formato AAAA-MM-DD'),
        query('dias').optional(opcional).isInt({ min: 1, max: 9999 })
            .withMessage('La cantidad de días hábiles debe ser un número entero mayor que cero').toInt(),
        query('sort').optional(opcional).isIn(gestion ? ORDEN_GESTION : ORDEN_PUBLICO)
            .withMessage(`El orden debe ser uno de: ${(gestion ? ORDEN_GESTION : ORDEN_PUBLICO).join(', ')}`),
        query('dir').optional(opcional).isIn(['asc', 'desc']).withMessage('La dirección del orden debe ser asc o desc'),
        ...validadoresPagina,
        ...(gestion
            ? [query('vigentes').optional(opcional).isBoolean().withMessage('vigentes debe ser true o false').toBoolean()]
            : []),
    ];
}

const CAMPOS_LICENCIA = ['colegioId', 'apellidoNombre', 'matricula', 'tipoProfesional', 'fechaComienzo',
    'tipoLicenciaId', 'diasHabiles', 'observacion'];

/**
 * Cuerpo del alta y de la corrección (LicenciaRequest del front). Valida la forma;
 * las reglas que dependen del tipo (días fijos o a mano, observación obligatoria,
 * tope anual) las aplica businessLayer/licencias/reglas.js.
 */
const validadoresLicencia = [
    soloCampos('body', CAMPOS_LICENCIA),
    body('colegioId').isInt({ min: 1 }).withMessage('Falta completar: Colegio o circunscripción').toInt(),
    body('apellidoNombre').isString().withMessage('Falta completar: Nombre y Apellido').bail()
        .trim().notEmpty().withMessage('Falta completar: Nombre y Apellido').bail()
        .isLength({ max: 120 }).withMessage('El apellido y nombre puede tener hasta 120 caracteres').bail()
        .custom((v) => /^[^,]*\S[^,]*,\s*\S/.test(v))
        .withMessage('El nombre debe tener el formato «APELLIDO, Nombre»'),
    body('matricula').isString().withMessage('Falta completar: Matrícula').bail()
        .trim().notEmpty().withMessage('Falta completar: Matrícula').bail()
        .isLength({ max: 40 }).withMessage('La matrícula puede tener hasta 40 caracteres'),
    body('tipoProfesional').isIn(['A', 'P']).withMessage('Falta completar: Tipo de profesional'),
    body('fechaComienzo').custom(esFechaValida).withMessage('Falta completar: Fecha de comienzo (fecha válida, AAAA-MM-DD)'),
    body('tipoLicenciaId').isInt({ min: 1 }).withMessage('Falta completar: Tipo de licencia').toInt(),
    body('diasHabiles').optional({ values: 'null' })
        .isInt({ min: 1, max: 9999 }).withMessage('La cantidad de días hábiles debe ser un número entero mayor que cero').toInt(),
    body('observacion').optional({ values: 'null' }).isString().withMessage('La observación no es válida').bail()
        .trim().isLength({ max: 255 }).withMessage('La observación puede tener hasta 255 caracteres'),
];

/** Parámetro :id numérico (licencias y lotes). */
const validadorId = [param('id').isInt({ min: 1 }).withMessage('El id no es válido').toInt()];

module.exports = {
    esFechaValida,
    ORDEN_PUBLICO,
    ORDEN_GESTION,
    validadoresLista,
    validadoresLicencia,
    validadorId,
};
