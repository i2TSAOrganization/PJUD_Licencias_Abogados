'use strict';

// Todo /api/carga: solo el contenidista, con sesión.
// La planilla y los lotes, además, solo con CARGA_MASIVA encendida (si no, 404).

const express = require('express');
const { requireSesion, requireRol } = require('../middleware-security/sesion');
const { cargaMasiva } = require('../middleware-security/cargaMasiva');
const cargaTiposRouter = require('./cargaTipos');
const cargaLicenciasRouter = require('./cargaLicencias');
const cargaLotesRouter = require('./cargaLotes');

const router = express.Router();

// Primero el interruptor: apagada, la carga masiva no existe (no hace falta ni consultar la sesión)
router.use(['/plantilla', '/lotes'], cargaMasiva);

router.use(requireSesion, requireRol('contenidista'));

router.use('/tipos-licencia', cargaTiposRouter);
router.use('/licencias', cargaLicenciasRouter);
router.use('/', cargaLotesRouter);              // /plantilla y /lotes/...

module.exports = router;
