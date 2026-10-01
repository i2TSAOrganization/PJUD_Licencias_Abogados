'use strict';

const express = require('express');
const { query, body } = require('express-validator');
const consultaBL = require('../businessLayer/licencias/consulta');
const controlBL = require('../businessLayer/licencias/control');
const altaBL = require('../businessLayer/licencias/alta');
const corregirBL = require('../businessLayer/licencias/corregir');
const anularBL = require('../businessLayer/licencias/anular');
const { validar, soloCampos } = require('../businessLayer/utils/validar');
const { validadoresLista, validadoresLicencia, validadorId, esFechaValida } = require('./validaciones');

const router = express.Router();

/**
 * @swagger
 * /api/carga/licencias:
 *   get:
 *     summary: Lista de Gestión del contenidista (CU-06)
 *     description: |
 *       Igual que la consulta pública, más las anuladas, el tipo de licencia, la observación y el lote.
 *       `resumen` trae el total de activas y anuladas de toda la base. Con `vigentes=true` excluye las
 *       anuladas (lo usa el PDF de Gestión).
 *     tags: [Gestión]
 *     security: [{ cookieSesion: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/nombre'
 *       - $ref: '#/components/parameters/matricula'
 *       - $ref: '#/components/parameters/tipoProfesional'
 *       - $ref: '#/components/parameters/colegioId'
 *       - $ref: '#/components/parameters/fecha'
 *       - $ref: '#/components/parameters/dias'
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [colegio, nombre, matricula, tipoProfesional, fechaComienzo, diasHabiles, tipoLicencia] }
 *       - $ref: '#/components/parameters/dir'
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/size'
 *       - in: query
 *         name: vigentes
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Página de licencias con resumen
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagina'
 *                 - type: object
 *                   properties:
 *                     items: { type: array, items: { $ref: '#/components/schemas/LicenciaCarga' } }
 *                     resumen: { type: object, example: { activas: 290, anuladas: 11 } }
 *       400: { $ref: '#/components/responses/Invalido' }
 *       401: { $ref: '#/components/responses/SinSesion' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.get('/', validadoresLista('gestion'), validar, consultaBL.listarGestion);

/**
 * @swagger
 * /api/carga/licencias/control:
 *   get:
 *     summary: Controles mientras se carga - carga repetida (RN-04) y máximo anual (RN-24 a RN-28)
 *     description: No guarda nada. `repetida` es null si el aviso está apagado (AVISO_REPETIDA=off) o no hay repetida; `tope` es null si el tipo no tiene máximo o no se supera.
 *     tags: [Gestión]
 *     security: [{ cookieSesion: [] }]
 *     parameters:
 *       - { in: query, name: colegioId, required: true, schema: { type: integer } }
 *       - { in: query, name: matricula, required: true, schema: { type: string } }
 *       - { in: query, name: fechaComienzo, required: true, schema: { type: string, format: date } }
 *       - { in: query, name: tipoLicenciaId, required: true, schema: { type: integer } }
 *       - { in: query, name: diasHabiles, schema: { type: integer }, description: Solo cuenta si el tipo es «a mano» }
 *       - { in: query, name: excluirId, schema: { type: integer }, description: Licencia que se corrige (no cuenta contra sí misma) }
 *     responses:
 *       200:
 *         description: Resultado de los controles
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ControlCarga' } } }
 *       400: { $ref: '#/components/responses/Invalido' }
 *       401: { $ref: '#/components/responses/SinSesion' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.get('/control',
    soloCampos('query', ['colegioId', 'matricula', 'fechaComienzo', 'tipoLicenciaId', 'diasHabiles', 'excluirId']),
    query('colegioId').isInt({ min: 1 }).withMessage('El Colegio no es válido').toInt(),
    query('matricula').isString().trim().notEmpty().withMessage('Falta la matrícula').bail()
        .isLength({ max: 40 }).withMessage('La matrícula puede tener hasta 40 caracteres'),
    query('fechaComienzo').custom(esFechaValida).withMessage('La fecha de comienzo debe ser una fecha válida (AAAA-MM-DD)'),
    query('tipoLicenciaId').isInt({ min: 1 }).withMessage('El tipo de licencia no es válido').toInt(),
    query('diasHabiles').optional({ values: 'falsy' }).isInt({ min: 1, max: 9999 })
        .withMessage('La cantidad de días hábiles debe ser un número entero mayor que cero').toInt(),
    query('excluirId').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('excluirId no es válido').toInt(),
    validar,
    controlBL.controlar);

/**
 * @swagger
 * /api/carga/licencias:
 *   post:
 *     summary: Alta de una licencia (CU-03)
 *     description: |
 *       Con un tipo de días fijos, los días los define el tipo (se ignora lo enviado). Con «Otro (días a mano)»
 *       los días y la observación son obligatorios. Si el tope anual del tipo bloquea, responde 422.
 *     tags: [Gestión]
 *     security: [{ cookieSesion: [], csrf: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/LicenciaRequest' } } }
 *     responses:
 *       201:
 *         description: Licencia creada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/LicenciaCarga' } } }
 *       400: { $ref: '#/components/responses/Invalido' }
 *       401: { $ref: '#/components/responses/SinSesion' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       422: { description: Tope anual superado en un tipo que bloquea }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/', validadoresLicencia, validar, altaBL.crear);

/**
 * @swagger
 * /api/carga/licencias/{id}:
 *   patch:
 *     summary: Corregir una licencia (CU-04)
 *     description: Mismas reglas que el alta. Sus propios días no cuentan contra el tope. No se puede corregir una anulada (404).
 *     tags: [Gestión]
 *     security: [{ cookieSesion: [], csrf: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/LicenciaRequest' } } }
 *     responses:
 *       200:
 *         description: Licencia corregida
 *         content: { application/json: { schema: { $ref: '#/components/schemas/LicenciaCarga' } } }
 *       400: { $ref: '#/components/responses/Invalido' }
 *       404: { $ref: '#/components/responses/NoExiste' }
 *       422: { description: Tope anual superado en un tipo que bloquea }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.patch('/:id', validadorId, validadoresLicencia, validar, corregirBL.corregir);

/**
 * @swagger
 * /api/carga/licencias/{id}/anular:
 *   post:
 *     summary: Anular una licencia (CU-05)
 *     description: No se borra ni se puede reactivar. Deja de verse en la consulta pública.
 *     tags: [Gestión]
 *     security: [{ cookieSesion: [], csrf: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { motivo: { type: string, maxLength: 200 } } }
 *     responses:
 *       200:
 *         description: Licencia anulada
 *         content: { application/json: { example: { id: 412, anulada: true } } }
 *       404: { $ref: '#/components/responses/NoExiste' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/:id/anular',
    validadorId,
    soloCampos('body', ['motivo']),
    body('motivo').optional({ values: 'null' }).isString().withMessage('El motivo no es válido').bail()
        .trim().isLength({ max: 200 }).withMessage('El motivo puede tener hasta 200 caracteres'),
    validar,
    anularBL.anular);

module.exports = router;
