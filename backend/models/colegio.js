'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('colegio', {
        id: { type: DataTypes.TINYINT.UNSIGNED, primaryKey: true },
        codigo: { type: DataTypes.STRING(10), allowNull: false },
        nombre: { type: DataTypes.STRING(60), allowNull: false },
        circunscripcion: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    });
};
