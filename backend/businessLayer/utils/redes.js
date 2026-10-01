'use strict';

// Rangos de IP (CIDR) con net.BlockList. Lo usan el acceso a /api-docs y
// las redes que se excluyen del límite de uso de la consulta pública.

const { BlockList } = require('net');

function normalizarIP(ip) {
    if (typeof ip !== 'string') return null;
    const limpia = ip.trim();
    if (limpia.toLowerCase().startsWith('::ffff:') && limpia.includes('.')) {
        return limpia.slice(7);
    }
    return limpia || null;
}

/** Devuelve un BlockList con los rangos válidos, o null si no hay ninguno. */
function construirRedes(listaCIDR, etiqueta) {
    if (!Array.isArray(listaCIDR) || listaCIDR.length === 0) return null;

    const redes = new BlockList();
    let cargadas = 0;

    for (const entrada of listaCIDR) {
        if (typeof entrada !== 'string' || !entrada.trim()) continue;

        const texto = entrada.trim();
        const barra = texto.indexOf('/');
        const base = barra === -1 ? texto : texto.slice(0, barra);
        const tipo = base.includes(':') ? 'ipv6' : 'ipv4';
        const prefijoPorDefecto = tipo === 'ipv6' ? 128 : 32;
        const prefijo = barra === -1 ? prefijoPorDefecto : Number(texto.slice(barra + 1));

        if (!Number.isInteger(prefijo) || prefijo < 0 || prefijo > prefijoPorDefecto) {
            console.warn(`[${etiqueta}] Rango inválido, se ignora: ${texto}`);
            continue;
        }
        try {
            redes.addSubnet(base, prefijo, tipo);
            cargadas++;
        } catch (error) {
            console.warn(`[${etiqueta}] Rango inválido, se ignora: ${texto} (${error.message})`);
        }
    }
    return cargadas > 0 ? redes : null;
}

/** true si la IP pertenece a alguno de los rangos. */
function ipEnRedes(redes, ipCruda) {
    const ip = normalizarIP(ipCruda);
    if (!redes || !ip) return false;
    try {
        return redes.check(ip, ip.includes(':') ? 'ipv6' : 'ipv4');
    } catch (error) {
        return false;
    }
}

module.exports = { normalizarIP, construirRedes, ipEnRedes };
