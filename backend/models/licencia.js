'use strict';

const { normMatricula } = require('../businessLayer/utils/texto');

module.exports = (sequelize, DataTypes) => {
    const Licencia = sequelize.define('licencia', {
        id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
        colegioId: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, field: 'colegio_id' },
        // Siempre «APELLIDO, Nombre» (RN-32)
        apellidoNombre: { type: DataTypes.STRING(120), allowNull: false, field: 'apellido_nombre' },
        matricula: { type: DataTypes.STRING(40), allowNull: false },
        // La completa el hook de abajo: nunca se asigna a mano (MySQL 5.7 no puede generarla)
        matriculaNorm: { type: DataTypes.STRING(40), allowNull: false, field: 'matricula_norm' },
        // 'A' abogado/a, 'P' procurador/a (RN-29). Dato público
        tipoProfesional: { type: DataTypes.ENUM('A', 'P'), allowNull: false, field: 'tipo_profesional' },
        fechaComienzo: { type: DataTypes.DATEONLY, allowNull: false, field: 'fecha_comienzo' },
        // Copia de los días del tipo, o escritos a mano (RN-22: un cambio del catálogo no la modifica)
        diasHabiles: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, field: 'dias_habiles' },
        tipoLicenciaId: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, field: 'tipo_licencia_id' },
        // Solo la ve el contenidista: la consulta pública ni la selecciona (RN-21)
        observacion: { type: DataTypes.STRING(255), allowNull: true },
        anulada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        motivoAnulacion: { type: DataTypes.STRING(200), allowNull: true, field: 'motivo_anulacion' },
        anuladaEn: { type: DataTypes.DATE, allowNull: true, field: 'anulada_en' },
        anuladaPor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'anulada_por' },
        loteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'lote_id' },
        creadoPor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'creado_por' },
        // Lo completa MySQL (DEFAULT CURRENT_TIMESTAMP)
        creadoEn: { type: DataTypes.DATE, field: 'creado_en' },
        modificadoPor: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'modificado_por' },
        modificadoEn: { type: DataTypes.DATE, allowNull: true, field: 'modificado_en' },
    });

    // matricula_norm acompaña siempre a matricula, al crear y al corregir.
    // Ojo: los INSERT/UPDATE con SQL directo (carga masiva) tienen que calcularla con normMatricula().
    Licencia.addHook('beforeValidate', (licencia) => {
        if (licencia.isNewRecord || licencia.changed('matricula')) {
            licencia.matriculaNorm = normMatricula(licencia.matricula);
        }
    });

    return Licencia;
};
