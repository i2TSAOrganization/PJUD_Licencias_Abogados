'use strict';

/** Escapa \, % y _ para que el texto del usuario no funcione como comodín en LIKE ... ESCAPE '\\'. */
const escapeLike = (s) => String(s).replace(/[\\%_]/g, '\\$&');

/**
 * Normaliza la matrícula: minúsculas y solo letras y números ("T° 11 F° 402" -> "t11f402").
 * Es lo que se guarda en licencia.matricula_norm y lo que se busca. En MySQL 5.7 no hay
 * REGEXP_REPLACE, así que la columna la completa siempre la API (hook del modelo licencia).
 */
const normMatricula = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Tipo de profesional (RN-29): código en la base y nombre que se muestra. */
const PROFESIONAL = { A: 'Abogado/a', P: 'Procurador/a' };

/** RN-32: «APELLIDO, Nombre» a partir de los dos campos del formulario. */
const armarNombre = (apellido, nombre) =>
    `${String(apellido).trim().toLocaleUpperCase('es')}, ${String(nombre).trim()}`;

/** Lo inverso, para precargar la ventana de Corregir: se parte por la primera coma. */
function partirNombre(apellidoNombre) {
    const an = String(apellidoNombre ?? '');
    const i = an.indexOf(',');
    return i < 0
        ? { apellido: an.trim(), nombre: '' }
        : { apellido: an.slice(0, i).trim(), nombre: an.slice(i + 1).trim() };
}

/** Mensaje del máximo anual: el mismo en la carga individual y en la masiva (RN-26). */
const mensajeTope = (total, maximo, tipo, anio, bloquea) =>
    `Tope anual superado: con esta licencia serían ${total} de ${maximo} días hábiles de «${tipo}» en ${anio}. ` +
    (bloquea ? 'No se carga.' : 'Se carga igual: verifique con el Colegio.');

module.exports = { escapeLike, normMatricula, PROFESIONAL, armarNombre, partirNombre, mensajeTope };
