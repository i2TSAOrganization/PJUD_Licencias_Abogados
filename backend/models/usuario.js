'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('usuario', {
        id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
        usuario: { type: DataTypes.STRING(60), allowNull: false },
        nombre: { type: DataTypes.STRING(120), allowNull: false },
        email: { type: DataTypes.STRING(160), allowNull: false },
        rol: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'contenidista' },
        passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
        activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        // El hash nunca sale por defecto; el login lo pide explícitamente con scope('conPassword').
        defaultScope: { attributes: { exclude: ['passwordHash'] } },
        scopes: { conPassword: { attributes: { include: ['passwordHash'] } } },
    });
};
