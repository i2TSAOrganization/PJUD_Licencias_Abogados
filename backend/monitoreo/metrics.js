// monitoreo/metrics.js — registro de métricas prom-client (compartido por el
// middleware de latencia y por el servidor separado de /metrics). Igual que en CAS.
'use strict';

const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register, prefix: 'node_' });

const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de requests HTTP',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register],
});

module.exports = { register, httpDuration };
