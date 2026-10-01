'use strict';

// La app completa con supertest, SIN base: usa test/fixtures/test.env (puerto 1, nadie escucha).
// Prueba lo que se resuelve antes de llegar a la base: rutas, seguridad y validaciones.

const path = require('node:path');
process.env.ENV_FILE = path.join(__dirname, 'fixtures', 'test.env');

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../sequelize');

after(() => sequelize.close());

/** Agente con la cookie XSRF-TOKEN ya obtenida, como hace el navegador. */
async function agenteConCsrf() {
    const agente = request.agent(app);
    const r = await agente.get('/api/nada');
    const token = /XSRF-TOKEN=([^;]+)/.exec(r.headers['set-cookie'].join(';'))[1];
    return { agente, token };
}

test('ruta inexistente: 404 con el cuerpo de error en español', async () => {
    const r = await request(app).get('/api/no-existe').expect(404);
    assert.deepEqual(r.body, { statusCode: 404, message: 'La ruta GET /api/no-existe no existe', error: 'No encontrado' });
});

test('headers de seguridad', async () => {
    const r = await request(app).get('/api/no-existe');
    assert.equal(r.headers['x-content-type-options'], 'nosniff');
    assert.equal(r.headers['x-frame-options'], 'DENY');
    assert.match(r.headers['content-security-policy'], /default-src 'none'/);
    assert.equal(r.headers['cache-control'], 'no-store');
    assert.equal(r.headers['x-powered-by'], undefined);
});

test('CSRF: emite XSRF-TOKEN legible por Angular (no HttpOnly)', async () => {
    const r = await request(app).get('/api/no-existe');
    const cookie = r.headers['set-cookie'].find((c) => c.startsWith('XSRF-TOKEN='));
    assert.ok(cookie, 'falta la cookie XSRF-TOKEN');
    assert.doesNotMatch(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
});

test('CSRF: POST sin el header da 403', async () => {
    const r = await request(app).post('/api/auth/logout').expect(403);
    assert.match(r.body.message, /Token de seguridad inválido/);
});

test('CSRF: POST con un header que no coincide da 403', async () => {
    const { agente } = await agenteConCsrf();
    await agente.post('/api/auth/logout').set('X-XSRF-TOKEN', 'otro-valor').expect(403);
});

test('CSRF: con cookie y header iguales el pedido pasa (llega a la validación)', async () => {
    const { agente, token } = await agenteConCsrf();
    const r = await agente.post('/api/auth/login').set('X-XSRF-TOKEN', token).send({}).expect(400);
    assert.ok(r.body.message.includes('Falta completar: Usuario'));
});

test('JSON mal formado: 400', async () => {
    const { agente, token } = await agenteConCsrf();
    const r = await agente.post('/api/auth/login').set('X-XSRF-TOKEN', token)
        .set('Content-Type', 'application/json').send('{mal').expect(400);
    assert.equal(r.body.message, 'El cuerpo de la solicitud no es un JSON válido');
});

test('/api/carga sin sesión: 401', async () => {
    const r = await request(app).get('/api/carga/licencias').expect(401);
    assert.equal(r.body.message, 'Se requiere iniciar sesión');
});

test('/api/carga con una cookie de sesión falsificada: 401', async () => {
    await request(app).get('/api/carga/tipos-licencia').set('Cookie', 'licencias_sesion=falsa').expect(401);
});

test('/api/auth/yo sin sesión: 401 (así el front sabe que no hay sesión)', async () => {
    await request(app).get('/api/auth/yo').expect(401);
});

test('carga masiva apagada: planilla y lotes dan 404 aun sin sesión', async () => {
    for (const url of ['/api/carga/plantilla', '/api/carga/lotes']) {
        const r = await request(app).get(url).expect(404);
        assert.equal(r.body.message, 'La carga masiva no está habilitada');
    }
});

test('consulta pública: size=1000 da 400', async () => {
    const r = await request(app).get('/api/licencias?size=1000').expect(400);
    assert.deepEqual(r.body.message, ['La cantidad por página debe ser un número entero entre 1 y 100']);
});

test('consulta pública: no se puede ordenar por tipo de licencia (dato sensible)', async () => {
    await request(app).get('/api/licencias?sort=tipoLicencia').expect(400);
});

test('consulta pública: un parámetro desconocido da 400', async () => {
    const r = await request(app).get('/api/licencias?hack=1').expect(400);
    assert.deepEqual(r.body.message, ['El campo hack no está permitido']);
});

test('consulta pública: tipo de profesional y fecha inválidos', async () => {
    const r = await request(app).get('/api/licencias?tipoProfesional=X&fecha=2026-02-30').expect(400);
    assert.equal(r.body.message.length, 2);
});
