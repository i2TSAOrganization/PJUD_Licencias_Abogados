'use strict';

// Sesión del contenidista. No se borra: se cierra con cerradaEn (logout o vencimiento).
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('sesion', {
        id: { type: DataTypes.CHAR(36), primaryKey: true },      // crypto.randomUUID()
        usuarioId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'usuario_id' },
        creadaEn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'creada_en' },
        ultimoUso: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'ultimo_uso' },
        cerradaEn: { type: DataTypes.DATE, allowNull: true, field: 'cerrada_en' },
        ip: { type: DataTypes.STRING(45), allowNull: true },
    });
};
