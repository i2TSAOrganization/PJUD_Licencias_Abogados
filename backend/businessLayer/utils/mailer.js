'use strict';

const nodemailer = require('nodemailer');
const config = require('../../resources/configurations/config.js');

// Sin SMTP_HOST (desarrollo local) el correo no sale: se arma y se muestra en la
// consola, así se puede probar el OTP sin servidor de correo.
const transporte = config.correo.host
    ? nodemailer.createTransport({
        host: config.correo.host,
        port: config.correo.port,
        secure: config.correo.secure,
        auth: config.correo.user ? { user: config.correo.user, pass: config.correo.pass } : undefined,
    })
    : nodemailer.createTransport({ jsonTransport: true });

async function enviarCorreo({ para, asunto, texto, html }) {
    const info = await transporte.sendMail({ from: config.correo.from, to: para, subject: asunto, text: texto, html });
    if (!config.correo.host) {
        console.log(`MAILER: (sin SMTP, no se envía) para=${para} asunto="${asunto}"\n${texto}`);
    }
    return info;
}

module.exports = { enviarCorreo };
