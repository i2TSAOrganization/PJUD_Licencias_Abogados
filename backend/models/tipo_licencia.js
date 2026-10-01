'use strict';

// Catálogo de tipos (RN-18 a RN-24). Se mantiene por script: ver db/002_seed.sql.
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('tipo_licencia', {
        id: { type: DataTypes.TINYINT.UNSIGNED, primaryKey: true },
        codigo: { type: DataTypes.STRING(10), allowNull: false },
        nombre: { type: DataTypes.STRING(80), allowNull: false },
        // Días fijos del tipo; null si se escriben a mano
        diasHabiles: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true, field: 'dias_habiles' },
        diasAMano: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'dias_a_mano' },
        requiereObservacion: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'requiere_observacion' },
        // Máximo de días por año, abogado y tipo; null = sin máximo
        diasMaximoAnual: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true, field: 'dias_maximo_anual' },
        topeBloquea: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'tope_bloquea' },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        orden: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    });
};
