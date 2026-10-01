'use strict';

const { Colegio } = require('../../sequelize');

/** GET /api/colegios — los 5 Colegios, para los selectores (interface Colegio del front). */
exports.listar = async function (req, res) {
    const colegios = await Colegio.findAll({
        attributes: ['id', 'codigo', 'nombre', 'circunscripcion'],
        order: [['id', 'ASC']],
    });
    res.json(colegios);
};
