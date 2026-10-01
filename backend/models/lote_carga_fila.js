'use strict';

// Resultado de cada fila del archivo. Guarda el dato como vino (*Txt) y el ya interpretado.
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('lote_carga_fila', {
        id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
        loteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'lote_id' },
        nroFila: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'nro_fila' },
        resultado: { type: DataTypes.ENUM('OK', 'AVISO', 'ERROR'), allowNull: false },
        mensajes: { type: DataTypes.JSON, allowNull: true },
        colegioTxt: { type: DataTypes.STRING(60), allowNull: true, field: 'colegio_txt' },
        colegioId: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, field: 'colegio_id' },
        apellidoNombre: { type: DataTypes.STRING(120), allowNull: true, field: 'apellido_nombre' },
        matricula: { type: DataTypes.STRING(40), allowNull: true },
        profesionalTxt: { type: DataTypes.STRING(30), allowNull: true, field: 'profesional_txt' },
        tipoProfesional: { type: DataTypes.ENUM('A', 'P'), allowNull: true, field: 'tipo_profesional' },
        fechaComienzo: { type: DataTypes.DATEONLY, allowNull: true, field: 'fecha_comienzo' },
        diasTxt: { type: DataTypes.STRING(20), allowNull: true, field: 'dias_txt' },
        diasHabiles: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true, field: 'dias_habiles' },
        tipoTxt: { type: DataTypes.STRING(80), allowNull: true, field: 'tipo_txt' },
        tipoLicenciaId: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, field: 'tipo_licencia_id' },
        observacion: { type: DataTypes.STRING(255), allowNull: true },
        licenciaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'licencia_id' },
    });
};
