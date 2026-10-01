'use strict';

const express = require('express');
const consultaBL = require('../businessLayer/licencias/consulta');
const { validar } = require('../businessLayer/utils/validar');
const { validadoresLista } = require('./validaciones');

const router = express.Router();

/**
 * @swagger
 * /api/licencias:
 *   get:
 *     summary: Consulta pública de licencias (CU-01)
 *     description: |
 *       Libre, sin ingreso. Devuelve solo los datos públicos: nunca el tipo de licencia, la observación
 *       ni las licencias anuladas. Los filtros se combinan entre sí. Orden por defecto: fecha de comienzo descendente.
 *     tags: [Consulta]
 *     parameters:
 *       - $ref: '#/components/parameters/nombre'
 *       - $ref: '#/components/parameters/matricula'
 *       - $ref: '#/components/parameters/tipoProfesional'
 *       - $ref: '#/components/parameters/colegioId'
 *       - $ref: '#/components/parameters/fecha'
 *       - $ref: '#/components/parameters/dias'
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [colegio, nombre, matricula, tipoProfesional, fechaComienzo, diasHabiles] }
 *       - $ref: '#/components/parameters/dir'
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/size'
 *     responses:
 *       200:
 *         description: Página de licencias públicas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagina'
 *                 - type: object
 *                   properties:
 *                     items: { type: array, items: { $ref: '#/components/schemas/LicenciaPublica' } }
 *       400: { $ref: '#/components/responses/Invalido' }
 *       429: { description: Demasiadas consultas desde la misma IP }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.get('/', validadoresLista('publica'), validar, consultaBL.listarPublica);

module.exports = router;
