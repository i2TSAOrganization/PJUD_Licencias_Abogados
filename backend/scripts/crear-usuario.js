'use strict';

// Crea un contenidista. En esta versión no hay pantalla de usuarios: los 5 o 6
// contenidistas se dan de alta con este script, en cada ambiente.
//
//   npm run usuario:crear -- <usuario> <email> "<Nombre y apellido>"
//
// La contraseña se pide por consola sin mostrarla (dos veces). Nunca va como
// argumento: quedaría en el historial de la consola y en la lista de procesos.
// Usa la conexión del .env: el usuario de la aplicación alcanza (solo hace INSERT).

const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../sequelize');

const COSTO_BCRYPT = 12;
const MINIMO_CLAVE = 10;
const ROL = 'contenidista';

function salir(mensaje) {
    console.error(`ERROR: ${mensaje}`);
    process.exitCode = 1;
}

/** Pregunta sin mostrar lo que se escribe (muestra * por cada carácter). */
function preguntarOculto(texto) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        rl._writeToOutput = function (s) {
            if (!rl.oculto) return rl.output.write(s);
            if (s.includes('\n') || s.includes('\r')) return rl.output.write('\n');
            return rl.output.write('*');
        };
        rl.question(texto, (respuesta) => {
            rl.close();
            resolve(respuesta);
        });
        rl.oculto = true;   // el texto de la pregunta ya se escribió: de acá en más, ocultar
    });
}

/** Sin consola interactiva (por ejemplo, con un pipe): lee las dos líneas de stdin. */
async function leerLineasStdin() {
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    const lineas = [];
    for await (const linea of rl) lineas.push(linea);
    return lineas;
}

async function main() {
    const [usuario, email, nombre] = process.argv.slice(2).map((s) => String(s ?? '').trim());

    if (!usuario || !email || !nombre) {
        return salir('Uso: npm run usuario:crear -- <usuario> <email> "<Nombre y apellido>"');
    }
    if (!/^[a-zA-Z0-9._-]{3,60}$/.test(usuario)) {
        return salir('El usuario debe tener de 3 a 60 caracteres: letras, números, punto, guion o guion bajo');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
        return salir('El email no es válido');
    }
    if (nombre.length < 3 || nombre.length > 120) {
        return salir('El nombre debe tener de 3 a 120 caracteres');
    }

    const existente = await db.Usuario.findOne({ where: { usuario } });
    if (existente) {
        return salir(`El usuario "${usuario}" ya existe (id ${existente.id}, ${existente.activo ? 'activo' : 'inactivo'})`);
    }

    let clave, repetida;
    if (process.stdin.isTTY) {
        clave = await preguntarOculto(`Contraseña para ${usuario} (mínimo ${MINIMO_CLAVE} caracteres): `);
        repetida = await preguntarOculto('Repetir la contraseña: ');
    } else {
        [clave, repetida] = await leerLineasStdin();
    }

    if (!clave || clave.length < MINIMO_CLAVE) {
        return salir(`La contraseña debe tener al menos ${MINIMO_CLAVE} caracteres`);
    }
    if (clave !== repetida) {
        return salir('Las contraseñas no coinciden');
    }

    const passwordHash = await bcrypt.hash(clave, COSTO_BCRYPT);
    const creado = await db.Usuario.create({ usuario, nombre, email: email.toLowerCase(), rol: ROL, passwordHash, activo: true });
    console.log(`Usuario creado: id ${creado.id} · ${usuario} · ${nombre} · ${email.toLowerCase()} · rol ${ROL}`);
}

main()
    .catch((e) => salir(e.message))
    .finally(() => db.sequelize.close());
