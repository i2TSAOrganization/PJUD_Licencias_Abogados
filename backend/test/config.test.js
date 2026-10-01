'use strict';

// Patrón de CAS: config.js se carga en un proceso aparte con un .env temporal,
// para probar las variables obligatorias, los valores por defecto y los errores.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const CONFIG_PATH = path.resolve(__dirname, '..', 'resources', 'configurations', 'config.js');

function runWithEnv(envFileContent) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, envFileContent);

    const script = `
        process.env.ENV_FILE = ${JSON.stringify(envFile)};
        try {
            const config = require(${JSON.stringify(CONFIG_PATH)});
            process.stdout.write(JSON.stringify({ ok: true, config }));
        } catch (error) {
            process.stdout.write(JSON.stringify({ ok: false, message: error.message }));
        }
    `;
    // Entorno mínimo: que no se cuelen variables del proceso que corre los tests
    const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot };
    const output = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] });

    fs.rmSync(tmpDir, { recursive: true, force: true });
    return JSON.parse(output);
}

const ENV_COMPLETO = [
    'DB_HOST=10.0.0.1',
    'DB_NAME=podjud_licencias',
    'DB_USER=licencias_app',
    'DB_PASS=secreto',
    'JWT_SECRET=0123456789abcdef0123456789abcdef',
].join('\n');

const sin = (variable) => ENV_COMPLETO.split('\n').filter((l) => !l.startsWith(`${variable}=`)).join('\n');

test('carga con las variables obligatorias presentes', () => {
    const r = runWithEnv(ENV_COMPLETO);
    assert.equal(r.ok, true, r.message);
    assert.equal(r.config.db.host, '10.0.0.1');
    assert.equal(r.config.db.database, 'podjud_licencias');
});

for (const variable of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'JWT_SECRET']) {
    test(`falla y nombra la variable si falta ${variable}`, () => {
        const r = runWithEnv(sin(variable));
        assert.equal(r.ok, false);
        assert.match(r.message, new RegExp(variable));
    });
}

test('rechaza un JWT_SECRET de menos de 32 caracteres', () => {
    const r = runWithEnv(`${sin('JWT_SECRET')}\nJWT_SECRET=corto`);
    assert.equal(r.ok, false);
    assert.match(r.message, /al menos 32/);
});

test('rechaza un número inválido', () => {
    const r = runWithEnv(`${ENV_COMPLETO}\nDB_PORT=abc`);
    assert.equal(r.ok, false);
    assert.match(r.message, /DB_PORT/);
});

test('usa los valores por defecto', () => {
    const r = runWithEnv(ENV_COMPLETO);
    assert.equal(r.ok, true, r.message);
    assert.equal(r.config.port, 3000);
    assert.equal(r.config.db.port, 3306);
    assert.equal(r.config.sesion.minutosInactividad, 30);
    assert.equal(r.config.throttleLimit, 120);
    assert.equal(r.config.cargaMasiva, false, 'la carga masiva sale apagada');
    assert.equal(r.config.avisoRepetida, false, 'el aviso de repetida sale apagado');
    assert.equal(r.config.enviroment, 'development');
    assert.equal(r.config.sesion.cookieSecure, true, 'fuera de local la cookie va Secure');
    assert.deepEqual(r.config.throttleExcluirRedes, []);
});

test('en local la cookie no es Secure (http sin Apache)', () => {
    const r = runWithEnv(`${ENV_COMPLETO}\nNODE_ENV=local`);
    assert.equal(r.config.sesion.cookieSecure, false);
});

test('los interruptores aceptan on y off', () => {
    const r = runWithEnv(`${ENV_COMPLETO}\nCARGA_MASIVA=on\nAVISO_REPETIDA=off`);
    assert.equal(r.config.cargaMasiva, true);
    assert.equal(r.config.avisoRepetida, false);
});
