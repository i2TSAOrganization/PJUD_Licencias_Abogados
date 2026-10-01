/**
 * ============================================
 * MIDDLEWARE: Security Headers
 * ============================================
 * Headers de seguridad HTTP (adaptado de CAS_Gestion_Usuarios_API).
 * La API solo devuelve JSON: la CSP es la más cerrada posible, salvo en
 * /api-docs, donde Swagger UI necesita sus scripts y estilos.
 */

'use strict';

const crypto = require('crypto');

const CSP_API = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

const CSP_API_DOCS = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
].join('; ');

const SECURITY_HEADERS = {
    // Previene MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    // Previene clickjacking
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Resource-Policy': 'same-origin',
};

function securityHeaders(req, res, next) {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        res.set(header, value);
    }
    res.set('Content-Security-Policy', req.path.startsWith('/api-docs') ? CSP_API_DOCS : CSP_API);
    // Las respuestas de la API no se cachean: cambian con cada carga
    if (req.path.startsWith('/api/')) {
        res.set('Cache-Control', 'no-store');
    }
    res.set('X-Request-ID', `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`);
    res.removeHeader('X-Powered-By');
    next();
}

module.exports = { securityHeaders, SECURITY_HEADERS };
