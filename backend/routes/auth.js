'use strict';

const express = require('express');
const { body } = require('express-validator');
const yoBL = require('../businessLayer/auth/yo');
const loginBL = require('../businessLayer/auth/login');
const otpBL = require('../businessLayer/auth/otp');
const logoutBL = require('../businessLayer/auth/logout');
const { validar, soloCampos } = require('../businessLayer/utils/validar');
const { intentoLoginPorIP, intentoLoginPorCuenta, intentoOtp } = require('../businessLayer/utils/rateLimiters');
const { requireSesion } = require('../middleware-security/sesion');

const router = express.Router();

/**
 * @swagger
 * /api/auth/yo:
 *   get:
 *     summary: Usuario de la sesión actual
 *     description: El front lo llama al iniciar para saber si hay sesión. 401 = sin sesión.
 *     tags: [Ingreso]
 *     security: [{ cookieSesion: [] }]
 *     responses:
 *       200:
 *         description: Usuario con sesión abierta
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Usuario' } } }
 *       401: { $ref: '#/components/responses/SinSesion' }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.get('/yo', requireSesion, yoBL.obtener);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Ingreso, paso 1 - usuario y contraseña (CU-02)
 *     description: Si son correctos, envía un código de un solo uso al correo del usuario.
 *     tags: [Ingreso]
 *     security: [{ csrf: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, password]
 *             properties: { usuario: { type: string }, password: { type: string, format: password } }
 *     responses:
 *       200:
 *         description: Código enviado
 *         content: { application/json: { example: { otpEnviado: true, destino: "j***@justiciasantafe.gov.ar" } } }
 *       400: { $ref: '#/components/responses/Invalido' }
 *       401: { description: Usuario o contraseña incorrectos (mismo mensaje si el usuario no existe o está inactivo) }
 *       429: { description: Demasiados intentos }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/login',
    intentoLoginPorIP,
    intentoLoginPorCuenta,
    soloCampos('body', ['usuario', 'password']),
    body('usuario').isString().trim().notEmpty().withMessage('Falta completar: Usuario').bail()
        .isLength({ max: 60 }).withMessage('El usuario no es válido'),
    body('password').isString().notEmpty().withMessage('Falta completar: Contraseña').bail()
        .isLength({ max: 200 }).withMessage('La contraseña no es válida'),
    validar,
    loginBL.ingresar);

/**
 * @swagger
 * /api/auth/otp:
 *   post:
 *     summary: Ingreso, paso 2 - código recibido por correo (CU-02)
 *     description: Si el código es correcto y está vigente, abre la sesión (cookie HttpOnly) y devuelve el usuario.
 *     tags: [Ingreso]
 *     security: [{ csrf: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario, codigo]
 *             properties: { usuario: { type: string }, codigo: { type: string, example: "482913" } }
 *     responses:
 *       200:
 *         description: Sesión abierta
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Usuario' } } }
 *       400: { $ref: '#/components/responses/Invalido' }
 *       401: { description: Código incorrecto o vencido }
 *       429: { description: Demasiados intentos }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/otp',
    intentoOtp,
    soloCampos('body', ['usuario', 'codigo']),
    body('usuario').isString().trim().notEmpty().withMessage('Falta completar: Usuario').bail()
        .isLength({ max: 60 }).withMessage('El usuario no es válido'),
    body('codigo').isString().trim().matches(/^\d{4,8}$/).withMessage('El código debe tener solo números'),
    validar,
    otpBL.verificar);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión (CU-07)
 *     description: Idempotente. Cierra la sesión si había una y siempre borra la cookie.
 *     tags: [Ingreso]
 *     security: [{ csrf: [] }]
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *         content: { application/json: { example: { ok: true } } }
 *       501: { $ref: '#/components/responses/Pendiente' }
 */
router.post('/logout', logoutBL.salir);

module.exports = router;
