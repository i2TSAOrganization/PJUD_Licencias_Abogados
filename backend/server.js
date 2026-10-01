'use strict';

// =============================================================================
// TIMESTAMPS EN TODOS LOS LOGS
// DEBE ser lo primero de todo, antes de cualquier require(), para que los
// mensajes de carga de módulos también lleven fecha/hora (igual que en CAS).
// =============================================================================
const _logOrig = console.log.bind(console);
const _errOrig = console.error.bind(console);
const _warnOrig = console.warn.bind(console);
console.log = (...args) => _logOrig(`[${new Date().toISOString()}]`, ...args);
console.error = (...args) => _errOrig(`[${new Date().toISOString()}]`, ...args);
console.warn = (...args) => _warnOrig(`[${new Date().toISOString()}]`, ...args);

const http = require('http');
const config = require('./resources/configurations/config.js');
const { sequelize } = require('./sequelize');
const app = require('./app');
const { startMetricsServer } = require('./monitoreo/metrics-server');

console.log(`Iniciando licencias-api · Node ${process.version} · ambiente ${config.enviroment}`);

// Node escucha HTTP en loopback: Apache termina el TLS y reenvía /api
const server = http.createServer(app);
server.listen(config.port, '127.0.0.1', () => {
    console.log(`licencias-api escuchando en 127.0.0.1:${config.port} (HTTP — TLS gestionado por Apache)`);
});

const metricsServer = startMetricsServer(config.metricsPort);

async function gracefulShutdown(signal) {
    console.log(`${signal} recibido. Cerrando el servidor y la conexión a la base...`);
    server.close();
    metricsServer.close();
    try {
        await sequelize.close();
        console.log('Conexiones cerradas correctamente.');
    } catch (err) {
        console.error('Error al cerrar conexiones:', err.message);
    }
    process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
