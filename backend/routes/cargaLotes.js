'use strict';

const express = require('express');
const multer = require('multer');
const { param } = require('express-validator');
const plantillaBL = require('../businessLayer/lotes/plantilla');
const validarBL = require('../businessLayer/lotes/validar');
const confirmarBL = require('../businessLayer/lotes/confirmar');
const listarBL = require('../businessLayer/lotes/listar');
const revertirBL = require('../businessLayer/lotes/revertir');
const { validar, soloCampos } = require('../businessLayer/utils/validar');
const { validadoresPagina } = require('../businessLayer/utils/paginacion');
const { validadorId } = require('./validaciones');

const router = express.Router();

// El archivo se lee en memoria y nunca se guarda en disco (sección 4.6 del modelado)
const subirArchivo = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024, files: 1, fields: 5 },
}).single('archivo');

/**
 * @swagger
 * /api/carga/plantilla:
 *   get:
 *     summary: Planilla Excel para la carga masiva, generada desde la base (CU-08)
 *     tags: [Carga masiva]
 *     security: [{ cookieSesion: [] }]
 *     responses:
 *       200:
 *         description: Archivo .xlsx
 *         content: { application/vnd.openxmlformats-officedocument.spreadsheetml.sheet: { schema: { type: string, format: binary } } }
 *       404: { $ref: '#/components/responses/NoExiste' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.get('/plantilla', plantillaBL.descargar);

/**
 * @swagger
 * /api/carga/lotes/validar:
 *   post:
 *     summary: Valida un archivo de carga masiva sin guardar licencias (CU-08)
 *     description: |
 *       Acepta .xlsx o .csv de hasta 1 MB y 500 filas, en el campo `archivo`. Valida cada fila con las mismas
 *       reglas que la carga individual y guarda un lote en borrador. Devuelve todas las filas con su resultado
 *       y un `token` para confirmar.
 *     tags: [Carga masiva]
 *     security: [{ cookieSesion: [], csrf: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, properties: { archivo: { type: string, format: binary } } }
 *     responses:
 *       201:
 *         description: Archivo validado (ValidacionLote)
 *       400: { $ref: '#/components/responses/Invalido' }
 *       413: { description: El archivo supera 1 MB }
 *       404: { $ref: '#/components/responses/NoExiste' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/lotes/validar', subirArchivo, validarBL.validar);

/**
 * @swagger
 * /api/carga/lotes/{token}/confirmar:
 *   post:
 *     summary: Confirma un lote validado y guarda sus licencias correctas y con aviso
 *     tags: [Carga masiva]
 *     security: [{ cookieSesion: [], csrf: [] }]
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string }, description: El token que devolvió validar }
 *     responses:
 *       200:
 *         description: Lote cargado (ConfirmacionLote)
 *         content: { application/json: { example: { lote: { id: 7, numero: "2026-10-09-01" }, cargadas: 51, omitidas: [] } } }
 *       404: { $ref: '#/components/responses/NoExiste' }
 *       409: { description: El lote no está pendiente de confirmar }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/lotes/:token/confirmar',
    param('token').matches(/^\d{1,10}$/).withMessage('El token del lote no es válido'),
    validar,
    confirmarBL.confirmar);

/**
 * @swagger
 * /api/carga/lotes:
 *   get:
 *     summary: Lotes cargados (confirmados o revertidos), paginados
 *     tags: [Carga masiva]
 *     security: [{ cookieSesion: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/size'
 *     responses:
 *       200:
 *         description: Página de lotes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagina'
 *                 - type: object
 *                   properties:
 *                     items: { type: array, items: { $ref: '#/components/schemas/Lote' } }
 *       404: { $ref: '#/components/responses/NoExiste' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.get('/lotes', soloCampos('query', ['page', 'size']), validadoresPagina, validar, listarBL.listar);

/**
 * @swagger
 * /api/carga/lotes/{id}/revertir:
 *   post:
 *     summary: Revierte un lote - anula sus licencias activas (CU-09)
 *     tags: [Carga masiva]
 *     security: [{ cookieSesion: [], csrf: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Lote revertido
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Lote' } } }
 *       404: { $ref: '#/components/responses/NoExiste' }
 *       409: { description: El lote no está confirmado o ya fue revertido }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/lotes/:id/revertir', validadorId, validar, revertirBL.revertir);

module.exports = router;
