'use strict';

const express = require('express');
const tiposBL = require('../businessLayer/tipos/tipos');

const router = express.Router();

/**
 * @swagger
 * /api/carga/tipos-licencia:
 *   get:
 *     summary: Catálogo de tipos de licencia activos (RN-18 a RN-24)
 *     tags: [Gestión]
 *     security: [{ cookieSesion: [] }]
 *     responses:
 *       200:
 *         description: Tipos activos, en orden
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/TipoLicencia' } }
 *       401: { $ref: '#/components/responses/SinSesion' }
 *       403: { $ref: '#/components/responses/SinPermiso' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.get('/', tiposBL.listar);

module.exports = router;
