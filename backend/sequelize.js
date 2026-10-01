'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const config = require('./resources/configurations/config.js');

const ColegioModel = require('./models/colegio.js');
const TipoLicenciaModel = require('./models/tipo_licencia.js');
const UsuarioModel = require('./models/usuario.js');
const SesionModel = require('./models/sesion.js');
const LicenciaModel = require('./models/licencia.js');
const LoteCargaModel = require('./models/lote_carga.js');
const LoteCargaFilaModel = require('./models/lote_carga_fila.js');

// El servidor de MySQL 5.7 corre sin modo estricto (sql_mode vacío) y en latin1.
// Sin tocar el servidor (lo comparten otros sistemas), cada conexión de la API
// pide utf8mb4 y activa el modo estricto solo para sí misma: así un dato inválido
// da error en lugar de guardarse truncado o vacío.
const SQL_MODE = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

const sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    timezone: '-03:00',
    dialectOptions: {
        charset: 'utf8mb4',
    },
    hooks: {
        afterConnect: async (connection) => {
            await connection.promise().query(`SET SESSION sql_mode = '${SQL_MODE}'`);
        },
    },
    logging: config.db.logging ? (sql) => console.log('SQL:', sql) : false,
    pool: {
        max: config.db.poolMax,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        timestamps: false,
        freezeTableName: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
});

// Tablas
const Colegio = ColegioModel(sequelize, DataTypes);
const TipoLicencia = TipoLicenciaModel(sequelize, DataTypes);
const Usuario = UsuarioModel(sequelize, DataTypes);
const Sesion = SesionModel(sequelize, DataTypes);
const Licencia = LicenciaModel(sequelize, DataTypes);
const LoteCarga = LoteCargaModel(sequelize, DataTypes);
const LoteCargaFila = LoteCargaFilaModel(sequelize, DataTypes);

// Asociaciones
Licencia.belongsTo(Colegio, { as: 'colegio', foreignKey: 'colegioId' });
Licencia.belongsTo(TipoLicencia, { as: 'tipoLicencia', foreignKey: 'tipoLicenciaId' });
Licencia.belongsTo(LoteCarga, { as: 'lote', foreignKey: 'loteId' });
Sesion.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuarioId' });
LoteCarga.hasMany(LoteCargaFila, { as: 'filas', foreignKey: 'loteId' });
LoteCargaFila.belongsTo(LoteCarga, { as: 'lote', foreignKey: 'loteId' });

// Sin sync(): el esquema lo manejan los scripts de db/.
// Si la base no responde al arrancar, la API arranca igual y /api/salud informa 503.
sequelize.authenticate()
    .then(() => console.log(`DB: conectado a ${config.db.host}:${config.db.port}/${config.db.database}`))
    .catch((err) => console.error(`DB: no se pudo conectar a ${config.db.host}:${config.db.port} -> ${err.message}`));

module.exports = {
    sequelize,
    Colegio,
    TipoLicencia,
    Usuario,
    Sesion,
    Licencia,
    LoteCarga,
    LoteCargaFila,
};
