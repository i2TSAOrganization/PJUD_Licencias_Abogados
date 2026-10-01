'use strict';

// Punto único de montaje de las rutas de /api. Cada área tiene su archivo en routes/.

const express = require('express');
const saludRouter = require('../monitoreo/health');
const colegiosRouter = require('./colegios');
const licenciasRouter = require('./licencias');
const authRouter = require('./auth');
const cargaRouter = require('./carga');

const router = express.Router();

// Públicas
router.use('/', saludRouter);              // GET /api/salud
router.use('/colegios', colegiosRouter);   // GET /api/colegios
router.use('/licencias', licenciasRouter); // GET /api/licencias

// Ingreso
router.use('/auth', authRouter);           // /api/auth/yo, login, otp, logout

// Contenidista (sesión + rol)
router.use('/carga', cargaRouter);         // /api/carga/...

module.exports = router;
