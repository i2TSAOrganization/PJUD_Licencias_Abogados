// monitoreo/metrics-server.js — servidor HTTP INDEPENDIENTE del Express principal,
// solo para /metrics (igual que en CAS). La API escucha en 127.0.0.1 y Prometheus
// (en Docker) no llega a un socket loopback: este servidor escucha en 0.0.0.0 en
// METRICS_PORT y filtra por IP de origen.
'use strict';

const http = require('http');
const { register } = require('./metrics');

function startMetricsServer(port, allowedPrefixes) {
    const prefixes = allowedPrefixes || ['127.0.0.1', '::1', '172.20.'];

    const server = http.createServer(async (req, res) => {
        const ip = (req.socket.remoteAddress || '').replace('::ffff:', '');
        const allowed = prefixes.some((p) => ip === p || ip.startsWith(p));

        if (req.url !== '/metrics' || !allowed) {
            res.writeHead(403);
            res.end();
            return;
        }
        try {
            res.setHeader('Content-Type', register.contentType);
            res.end(await register.metrics());
        } catch (err) {
            res.writeHead(500);
            res.end(String(err));
        }
    });

    server.on('error', (err) => console.error(`MÉTRICAS: no se pudo abrir el puerto ${port} -> ${err.message}`));
    server.listen(port, '0.0.0.0', () => console.log(`Métricas Prometheus en 0.0.0.0:${port}/metrics`));
    return server;
}

module.exports = { startMetricsServer };
