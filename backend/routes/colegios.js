'use strict';

const express = require('express');
const colegiosBL = require('../businessLayer/colegios/colegios');

const router = express.Router();

/**
 * @swagger
 * /api/colegios:
 *   get:
 *     summary: Lista los Colegios (circunscripciones) para los selectores
 *     tags: [Catálogos]
 *     responses:
 *       200:
 *         description: Los 5 Colegios, ordenados por id
 *         content:
 *           application/json:
 *             example:
 *               - { "id": 1, "codigo": "SFE", "nombre": "Santa Fe", "circunscripcion": 1 }
 *               - { "id": 2, "codigo": "ROS", "nombre": "Rosario", "circunscripcion": 2 }
 *       503:
 *         description: La base no está disponible
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', colegiosBL.listar);

module.exports = router;
