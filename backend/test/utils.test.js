'use strict';

// Funciones puras de businessLayer/utils y routes/validaciones. No usan la base.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { escapeLike, normMatricula, armarNombre, partirNombre, mensajeTope, PROFESIONAL } = require('../businessLayer/utils/texto');
const { calcularPagina, respuestaPaginada, SIZE_DEFECTO, SIZE_MAXIMO } = require('../businessLayer/utils/paginacion');
const { cuerpoError, HttpError, unprocessable } = require('../businessLayer/utils/errores');
const { construirRedes, ipEnRedes } = require('../businessLayer/utils/redes');
const { esFechaValida, ORDEN_PUBLICO, ORDEN_GESTION } = require('../routes/validaciones');

test('escapeLike neutraliza los comodines de LIKE', () => {
    assert.equal(escapeLike('50%_a\\'), '50\\%\\_a\\\\');
    assert.equal(escapeLike('garcía'), 'garcía');
});

test('normMatricula: minúsculas y solo letras y números', () => {
    assert.equal(normMatricula('T° 11 F° 402'), 't11f402');
    assert.equal(normMatricula('R-4412'), 'r4412');
    assert.equal(normMatricula(null), '');
});

test('armarNombre arma «APELLIDO, Nombre» (RN-32)', () => {
    assert.equal(armarNombre(' alcaraz ', 'Sofía'), 'ALCARAZ, Sofía');
    assert.equal(armarNombre('peña', 'José'), 'PEÑA, José');
});

test('partirNombre separa por la primera coma', () => {
    assert.deepEqual(partirNombre('ALCARAZ, Sofía Inés'), { apellido: 'ALCARAZ', nombre: 'Sofía Inés' });
    assert.deepEqual(partirNombre('SIN COMA'), { apellido: 'SIN COMA', nombre: '' });
    assert.equal(armarNombre(...Object.values(partirNombre('ocampo, Valeria'))), 'OCAMPO, Valeria');
});

test('mensajeTope: aviso y bloqueo (RN-26)', () => {
    const aviso = mensajeTope(6, 3, 'Fallecimiento de familiar directo', 2026, false);
    assert.match(aviso, /serían 6 de 3 días hábiles de «Fallecimiento de familiar directo» en 2026/);
    assert.match(aviso, /Se carga igual/);
    assert.match(mensajeTope(6, 3, 'X', 2026, true), /No se carga/);
});

test('PROFESIONAL tiene los dos tipos (RN-29)', () => {
    assert.deepEqual(PROFESIONAL, { A: 'Abogado/a', P: 'Procurador/a' });
});

test('paginación: 10 por defecto, máximo 100', () => {
    assert.equal(SIZE_DEFECTO, 10);
    assert.equal(SIZE_MAXIMO, 100);
});

test('calcularPagina: página fuera de rango devuelve la última (CU-01 A3)', () => {
    assert.deepEqual(calcularPagina(99, 10, 294), { page: 30, size: 10, pages: 30, offset: 290 });
    assert.deepEqual(calcularPagina(1, 10, 0), { page: 1, size: 10, pages: 1, offset: 0 });
    assert.deepEqual(calcularPagina(3, 25, 294), { page: 3, size: 25, pages: 12, offset: 50 });
});

test('respuestaPaginada tiene la forma Pagina del front', () => {
    const r = respuestaPaginada(['a'], 1, calcularPagina(1, 10, 1));
    assert.deepEqual(Object.keys(r), ['items', 'total', 'page', 'size', 'pages']);
});

test('cuerpoError en español, con texto o lista', () => {
    assert.deepEqual(cuerpoError(400, ['x']), { statusCode: 400, message: ['x'], error: 'Solicitud inválida' });
    assert.equal(cuerpoError(422, 'tope').error, 'No se puede procesar');
    const e = unprocessable('tope');
    assert.ok(e instanceof HttpError);
    assert.equal(e.status, 422);
});

test('esFechaValida: formato AAAA-MM-DD y fecha existente', () => {
    assert.equal(esFechaValida('2026-10-13'), true);
    assert.equal(esFechaValida('2028-02-29'), true);
    assert.equal(esFechaValida('2026-02-30'), false);
    assert.equal(esFechaValida('13/10/2026'), false);
    assert.equal(esFechaValida('2026-1-3'), false);
});

test('el orden por tipo de licencia es solo de Gestión', () => {
    assert.equal(ORDEN_PUBLICO.includes('tipoLicencia'), false);
    assert.equal(ORDEN_GESTION.includes('tipoLicencia'), true);
});

test('redes: rangos CIDR e IPv4 mapeada en IPv6', () => {
    const redes = construirRedes(['10.0.0.0/8', 'mal/99'], 'TEST');
    assert.equal(ipEnRedes(redes, '10.1.2.3'), true);
    assert.equal(ipEnRedes(redes, '::ffff:10.1.2.3'), true);
    assert.equal(ipEnRedes(redes, '192.168.0.1'), false);
    assert.equal(ipEnRedes(null, '10.1.2.3'), false);
});
