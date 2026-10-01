'use strict';

const { query } = require('express-validator');

// RN-08: 10 filas por defecto (la pantalla ofrece 10, 25 o 50), máximo 100.
const SIZE_DEFECTO = 10;
const SIZE_MAXIMO = 100;

/** Validadores de page y size, comunes a todas las listas. */
const validadoresPagina = [
    query('page').default(1).isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor o igual a 1').toInt(),
    query('size').default(SIZE_DEFECTO).isInt({ min: 1, max: SIZE_MAXIMO })
        .withMessage(`La cantidad por página debe ser un número entero entre 1 y ${SIZE_MAXIMO}`).toInt(),
];

/**
 * Calcula la página real. Si page supera la cantidad de páginas se devuelve la
 * última (CU-01 A3). Siempre hay al menos una página, aunque no haya filas.
 */
function calcularPagina(page, size, total) {
    const pages = Math.max(1, Math.ceil(total / size));
    const actual = Math.min(Math.max(page, 1), pages);
    return { page: actual, size, pages, offset: (actual - 1) * size };
}

/** Arma la respuesta paginada de la sección 4.4 del modelado. */
function respuestaPaginada(items, total, pagina) {
    return { items, total, page: pagina.page, size: pagina.size, pages: pagina.pages };
}

module.exports = { SIZE_DEFECTO, SIZE_MAXIMO, validadoresPagina, calcularPagina, respuestaPaginada };
