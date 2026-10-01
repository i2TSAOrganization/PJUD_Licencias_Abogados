'use strict';

// Verifica la conexión y los modelos contra la base del .env, sin dejar datos:
// todo lo que inserta queda dentro de una transacción que se deshace al final.
//   npm run db:verificar

const { Op } = require('sequelize');
const db = require('../sequelize');

async function main() {
    const [[sesion]] = await db.sequelize.query('SELECT VERSION() AS version, @@SESSION.sql_mode AS sqlMode, @@character_set_connection AS charset');
    console.log(`MySQL ${sesion.version} · charset ${sesion.charset} · sql_mode ${sesion.sqlMode}`);

    console.log(`Colegios: ${await db.Colegio.count()} (esperado 5) · Tipos: ${await db.TipoLicencia.count()} (esperado 3)`);

    const tx = await db.sequelize.transaction();
    try {
        const u = await db.Usuario.create({ usuario: `verif_${Date.now()}`, nombre: 'Verificación', email: 'v@localhost', passwordHash: '-' }, { transaction: tx });
        const l = await db.Licencia.create({
            colegioId: 2, apellidoNombre: 'GARCÍA, Ana', matricula: 'T° 11 F° 402', tipoProfesional: 'P',
            fechaComienzo: '2026-10-13', diasHabiles: 3, tipoLicenciaId: 1, creadoPor: u.id,
        }, { transaction: tx });
        const r = await db.Licencia.findByPk(l.id, { transaction: tx, include: ['colegio', 'tipoLicencia'] });
        console.log(`Licencia: matriculaNorm=${r.matriculaNorm} (esperado t11f402) · prof=${r.tipoProfesional} · fecha=${r.fechaComienzo} · ${r.colegio.nombre} · ${r.tipoLicencia.codigo}`);

        const sinTilde = await db.Licencia.count({ where: { apellidoNombre: { [Op.like]: '%garcia%' } }, transaction: tx });
        console.log(`Búsqueda "garcia" encuentra "GARCÍA": ${sinTilde > 0 ? 'sí' : 'NO'}`);

        try {
            await db.sequelize.query("UPDATE licencia SET tipo_profesional = 'X' WHERE id = ?", { replacements: [l.id], transaction: tx });
            console.log('Modo estricto: NO (aceptó un tipo_profesional inválido)');
        } catch (e) {
            console.log(`Modo estricto: sí (rechazó un tipo_profesional inválido: ${e.parent?.code})`);
        }
    } finally {
        await tx.rollback();
    }

    try {
        await db.sequelize.query('DELETE FROM colegio WHERE id = 99');
        console.log('Permiso DELETE: lo tiene (NO debería)');
    } catch (e) {
        console.log(`Permiso DELETE: denegado, correcto (${e.parent?.code})`);
    }
}

main()
    .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
    .finally(() => db.sequelize.close());
