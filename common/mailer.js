'use strict';

const nodemailer = require('nodemailer');

class Mailer {
    static send(callback, assunto, mensagem, isHtml = false, para = null, attachments = null) {
        if (!config.server.mail.sendEmail) {
            log.warn('mailer', 'Envio de email desabilitado nas configurações: verifique config.js');
        }

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            service: config.server.mail.service,
            host: config.server.mail.host,
            port: config.server.mail.port,
            secure: false,
            ignoreTLS: true,
            auth: {
                user: config.server.mail.auth.user,
                pass: config.server.mail.auth.pass
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: config.server.mail.overrideFrom,
            bcc: para || config.server.mail.overrideTo,
            replyTo: config.server.mail.overrideTo,
            subject: config.server.mail.subjectPrefix + assunto,
        };
        if (isHtml) {
            mailOptions.html = mensagem;
        } else {
            mailOptions.text = mensagem;
        }
        if (attachments) {
            mailOptions.attachments = attachments;
        }
        //
        // debug('mailOptions', mailOptions);

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            let isSuccess = null;
            if (error) {
                isSuccess = false;
                log.error(error);
            } else {
                isSuccess = true
                log.info('Message %s sent: %s', info.messageId, info.response);
            }
            if (callback) {
                callback(isSuccess);
            }
        });
    }
}

module.exports = Mailer;