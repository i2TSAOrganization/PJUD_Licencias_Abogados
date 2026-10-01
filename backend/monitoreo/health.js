// monitoreo/health.js — estado del servicio y de la base (GET /api/salud).
// Lo usan el monitoreo y la verificación después de cada despliegue; el front no.
'use strict';

const express = require('express');
const { sequelize } = require('../sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/salud:
 *   get:
 *     summary: Estado del servicio y de la base de datos
 *     tags: [Monitoreo]
 *     responses:
 *       200:
 *         description: Servicio y base disponibles
 *         content:
 *           application/json:
 *             example: { "estado": "ok", "base": "ok", "uptime": 1234 }
 *       503:
 *         description: La base no responde
 *         content:
 *           application/json:
 *             example: { "estado": "error", "base": "caida", "uptime": 1234 }
 */
router.get('/salud', async (req, res) => {
    const uptime = Math.round(process.uptime());
    try {
        await sequelize.query('SELECT 1');
        res.status(200).json({ estado: 'ok', base: 'ok', uptime });
    } catch (err) {
        // El detalle queda en el log, no en la respuesta
        console.error(`SALUD: la base no responde -> ${err.message}`);
        res.status(503).json({ estado: 'error', base: 'caida', uptime });
    }
});

module.exports = router;
