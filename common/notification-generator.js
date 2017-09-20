"use strict";
const fs = require('fs');
const async = require('async');
const Mustache = require('mustache');
const Mailer = require('./mailer');



const c_PATH_TEMPLATE_NOTIFICACAO = config.paths.root + '/public/templates/notificacao';
const c_FILE_TEMPLATE_NOTIFICACAO = c_PATH_TEMPLATE_NOTIFICACAO + '/padrao.html';

const c_TEXT_SUBJECT = {
    NOTIFICACAO_VIGENCIA_LIMITE_CREDITO: 'domain - Alerta de Vencimento da Vigência do Emissor de Crédito',
    NOTIFICACAO_TERMINO_LIMITE_CREDITO: 'domain - Alerta de Limite de Créditos'
}
const c_TEXT_BODY = {
    NOTIFICACAO_VIGENCIA_LIMITE_CREDITO: ` <p>Prezado(a) {{nomeResponsavel}},</p><br/>
        <p>Informamos que a vigência do Emissor de
        Crédito <strong>{{razaoSocial}}</strong> junto à domain será encerrada
        em {{dataFimVigencia}}. Entre em contato com a área
        responsável para informações sobre a
        renovação.</p>
        <p>Caso as providências necessárias já foram
        tomadas, pedimos que desconsidere esta mensagem.<br><br>
        Atenciosamente.</p>

        São Paulo Transporte S.A`,

    NOTIFICACAO_TERMINO_LIMITE_CREDITO: `<p>Prezado(a) {{nomeResponsavel}},</p><br>
        <p>Informamos que o Limite de Créditos do Emissor de Crédito <strong>{{razaoSocial}}</strong> atingiu o valor de <strong>{{ValorLimite}}</strong>. Verifique a necessidade de inclusão de novos valores de limite.</p>
        <p>Caso as providências necessárias já foram tomadas, pedimos que desconsidere esta mensagem.
        Atenciosamente.</p>
        
        São Paulo Transporte S.A.`

}

class NotificationGenerator {
    constructor(layoutPath, textBody, qtdEmailsPerPackage = 10, intervalSend = 2000) {
        this.qtdEmailsPerPackage = qtdEmailsPerPackage;
        this.intervalSend = intervalSend;
        this.layoutPath = !layoutPath || layoutPath === '' ? c_FILE_TEMPLATE_NOTIFICACAO : layoutPath;
        //Mapa de chave e valor para recuperar os dados enviados na lista de emails;
        this.listEmails = [];
        this.templateHtml = '';
        this.setTextBody(textBody);
    }

    setTextBody(textBody) {
        if (c_TEXT_BODY.hasOwnProperty(textBody)) {
            this.textBody = c_TEXT_BODY[textBody]
            this.setTextSubject(textBody);
        } else {
            this.textBody = textBody;
        }
    }

    setTextSubject(textSubject) {
        if (c_TEXT_SUBJECT.hasOwnProperty(textSubject)) {
            this.textSubject = c_TEXT_SUBJECT[textSubject];
        } else if (textSubject.length < 70) {
            this.textSubject = textSubject;
        }
    }

    loadTemplate(cb) {
        if (this.templateHtml !== '') {
            cb(this.templateHtml);
            return;
        }

        fs.readFile(this.layoutPath, 'utf8', (err, html) => {
            if (err) {
                cb(err, null);
                return;
            }
            this.templateHtml = html;
            cb(err, this.templateHtml);
        });
    }

    render(data, templateHtml) {
        return Mustache.render(this.templateHtml.replace('%texto%', this.textBody), data);
    }

    sendEmail(initIndex) {
        //let _self = this;
        let count = 0;
        for (let i = initIndex; i < this.listEmails.length; i++, count++) {
            if (count < this.qtdEmailsPerPackage) {
                let contact = this.listEmails[i];
                contact.subject = this.textSubject;
                let htmlToEmail = this.render(contact);
                Mailer.send(contact.email, this.textSubject, htmlToEmail, true);

            } else {
                count = 0;
                setTimeout(() => {
                    this.sendEmail(i);
                }, this.intervalSend);

                break;
            }
        }

    }

    send(listEmails, cb) {
        let _self = this;
        this.listEmails = listEmails;
        try {
            //Carrega o template do email
            this.loadTemplate((err, templateHtml) => {
                if (err) {
                    throw err;
                }
                this.templateHtml = templateHtml;
                //Inicia o disparo na lista com

                async.parallel([
                    function(callback) {
                        _self.sendEmail(0);
                    },
                ]);

                cb({ msg: "As notificações estão sendo enviadas" });
            });
        } catch (error) {
            throw error;
        }
    }
}
try {
    module.exports = exports = NotificationGenerator;
} catch (e) {
    exports = NotificationGenerator;
}