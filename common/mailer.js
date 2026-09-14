'use strict';

const nodemailer = require('nodemailer');

class Mailer {
    static send(callback, assunto, mensagem, isHtml = false, para = null, attachments = null) {
        let mailConfig = config.server.mail;
        if (!mailConfig.sendEmail) {
            log.warn('mailer', 'Envio de email desabilitado: defina MAIL_USER/MAIL_PASS para habilitar');
            if (callback) {
                callback(false);
            }
            return;
        }

        // TLS: implícito (MAIL_SECURE=true, porta 465) ou STARTTLS quando o servidor oferecer.
        // MAIL_REQUIRE_TLS=true recusa conexões sem STARTTLS.
        let transporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port,
            secure: Boolean(mailConfig.secure),
            requireTLS: Boolean(mailConfig.requireTLS),
            auth: {
                user: mailConfig.auth.user,
                pass: mailConfig.auth.pass
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: mailConfig.overrideFrom,
            bcc: para || mailConfig.overrideTo,
            replyTo: mailConfig.overrideTo,
            subject: mailConfig.subjectPrefix + assunto,
        };
        if (isHtml) {
            mailOptions.html = mensagem;
        } else {
            mailOptions.text = mensagem;
        }
        if (attachments) {
            mailOptions.attachments = attachments;
        }

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            let isSuccess = null;
            if (error) {
                isSuccess = false;
                log.error(error);
            } else {
                isSuccess = true
                log.info('Message ' + info.messageId + ' sent: ' + info.response);
            }
            if (callback) {
                callback(isSuccess);
            }
        });
    }
}

module.exports = Mailer;
