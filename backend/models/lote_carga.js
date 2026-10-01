'use strict';

// Un archivo de carga masiva (RN-16). BORRADOR → CONFIRMADO → REVERTIDO; un borrador sin confirmar queda DESCARTADO.
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('lote_carga', {
        id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
        numero: { type: DataTypes.STRING(20), allowNull: true },          // AAAA-MM-DD-NN, al confirmar
        archivo: { type: DataTypes.STRING(200), allowNull: false },
        estado: {
            type: DataTypes.ENUM('BORRADOR', 'CONFIRMADO', 'REVERTIDO', 'DESCARTADO'),
            allowNull: false,
            defaultValue: 'BORRADOR',
        },
        filasTotal: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'filas_total' },
        filasOk: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'filas_ok' },
        filasAviso: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'filas_aviso' },
        filasError: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'filas_error' },
        creadoPor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'creado_por' },
        creadoEn: { type: DataTypes.DATE, field: 'creado_en' },
        confirmadoEn: { type: DataTypes.DATE, allowNull: true, field: 'confirmado_en' },
        revertidoEn: { type: DataTypes.DATE, allowNull: true, field: 'revertido_en' },
        revertidoPor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'revertido_por' },
    });
};
