'use strict';
const messageEnum = require('./enum/message.enum');
const ResponseData = require('./response-data');
let Mensagem = require('./model/Message.model');
const moment = require('moment');
const _array = require('lodash-compat/array');

String.prototype.lpad = function (padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

class AppUtil {
    static debugBindVars(arr, bindVars) {
        AppUtil.showParamsNotPresent(arr, bindVars);
        AppUtil.showParamsUnexpected(arr, bindVars);
        AppUtil.showEmptyValues(arr, bindVars);
    }

    static showParamsNotPresent(arr, bindVars) {
        console.log("Parametros não presentes", _array.difference(arr, Object.keys(bindVars)));
    }

    static showParamsUnexpected(arr, bindVars) {
        console.log("Parametros não esperados", _array.difference(Object.keys(bindVars), arr));
    }

    static showEmptyValues(arr, bindVars) {
        var arr = [];
        var keys = Object.keys(bindVars);
        for (var index in keys) {
            var key = keys[index];
            var obj = bindVars[key];
            if (!obj || AppUtil.isInvalidValue(obj['val']))
                arr.push(key);
        }
        console.log("Parametros valores vazios", arr);
    }

    static infereType(data) {
        var _match1 = data.match(/\./g);
        var _match2 = data.match(/[^(\d+(\.\d{1,50})?)]/g);
        if (!_match2) {
            if (!_match1 || _match1.length <= 1) {
                var val = parseFloat(data);
                return (val || val === 0) ? val : data;
            } else {
                data = data.replace(/\./g, '');
                var val = parseFloat(data);
                return (val || val === 0) ? val : data;
            }
        }
        return data;
    }

    static isValidDate(data) {
        if (!data) {
            return false;
        }
        if (data instanceof Date) {
            return true;
        }
        if (/\d{4}[\-\/\s]?((((0[13578])|(1[02]))[\-\/\s]?(([0-2][0-9])|(3[01])))|(((0[469])|(11))[\-\/\s]?(([0-2][0-9])|(30)))|(02[\-\/\s]?[0-2][0-9]))/gi.test(data)) {
            let time = new Date(data).getTime();
            if (!isNaN(time) && time !== 0) {
                return true;
            }
        }
        return false;

    }

    static isInvalidNumber(value) {
        if (value == undefined || value == null || isNaN(value)) {
            return true;
        }
        return false;
    }

    static isInvalidValue(value) {
        if (value == undefined || value == null) {
            return true;
        }
        return false;
    }

    static getHoursOrTime(value, option) {
        if (AppUtil.isValidDate(value)) {
            switch (option) {
                case 'minutes':
                    return parseInt(new Date(value).getMinutes());
                case 'hours':
                    return parseInt(new Date(value).getHours());
            }
        } else {
            return null;
        }
    }

    static getTime(hours, minutes) {
        if (this.isInvalidNumber(hours) || this.isInvalidNumber(minutes)) {
            return null;
        }
        let dataEspecifica = new Date(Date.UTC(1970, 0, 1, hours, minutes));
        return dataEspecifica;
    }

    static validateCPF(cpf) {
        cpf = cpf.replace(/\D/g, "");
        var numeros, digitos, soma, i, resultado, digitos_iguais;
        digitos_iguais = 1;
        if (cpf.length < 11)
            return false;
        for (i = 0; i < cpf.length - 1; i++)
            if (cpf.charAt(i) != cpf.charAt(i + 1)) {
                digitos_iguais = 0;
                break;
            }
        if (!digitos_iguais) {
            numeros = cpf.substring(0, 9);
            digitos = cpf.substring(9);
            soma = 0;
            for (i = 10; i > 1; i--)
                soma += numeros.charAt(10 - i) * i;
            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(0))
                return false;
            numeros = cpf.substring(0, 10);
            soma = 0;
            for (i = 11; i > 1; i--)
                soma += numeros.charAt(11 - i) * i;
            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(1))
                return false;
            return true;
        } else
            return false;
    }

    static validateCNPJ(cnpj) {
        var numeros, digitos, tamanho, soma, pos, i, resultado, digitos_iguais;
        cnpj = cnpj.replace(/\D/g, "");
        cnpj = cnpj.replace(/[^\d]+/g, '');

        if (cnpj == '') return false;

        if (cnpj.length != 14)
            return false;

        // Elimina CNPJs invalidos conhecidos
        if (cnpj == "00000000000000" ||
            cnpj == "11111111111111" ||
            cnpj == "22222222222222" ||
            cnpj == "33333333333333" ||
            cnpj == "44444444444444" ||
            cnpj == "55555555555555" ||
            cnpj == "66666666666666" ||
            cnpj == "77777777777777" ||
            cnpj == "88888888888888" ||
            cnpj == "99999999999999")
            return false;

        // Valida DVs
        tamanho = cnpj.length - 2
        numeros = cnpj.substring(0, tamanho);
        digitos = cnpj.substring(tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0))
            return false;

        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1))
            return false;

        return true;

    }

    static arrayToString(value) {
        let newValue = JSON.stringify(value);
        newValue = newValue.replace(/\[/g, '').replace(/\]/g, '').replace(/\,/g, ';').replace(/\"/g, '').replace(/\&/g, ',');
        return newValue;
    }

    static dateToString(value = new Date()) {
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }
        return new String();
    }

    static dateClearTimer(value = new Date()) {
        if (value instanceof Date) {
            return new Date(AppUtil.dateToString(value));
        }
        return new Date(0);
    }

    static popularMensagem(value = new Mensagem(), data = {}) {
        value.codigo = data.codigo || value.codigo;
        value.mensagem = data.mensagem || value.mensagem;
    }

    static converteLobToBase64Image(lob, cb) {
        if (!lob || lob === null) {
            cb(null);
            return;
        }
        var str = "";
        lob.setEncoding('utf8');
        lob.on('error', function (err) {
            cb(err);
        });
        lob.on('close', function () {
            cb(null);
        });
        lob.on('data', function (chunk) {
            str += chunk;
        });
        lob.on('end', function () {
            //Retorna a string base64 no callback
            cb(new Buffer(str).toString());
        });
    }

    static fill(n, width, z) {
        z = z || '0';
        n = n.toString();
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    static isMobile(userAgent = '') {
        var txt = userAgent.substr(0, 4);
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(txt)) {
            return true;
        }
        return false;
    }

    static errorResponse(error, res, code, callback) {
        if (res) {
            res.status(code);
        }
        ResponseData.errorResponse(error, (data) => {
            if (messageEnum["server" + code]) {
                data.message.setMessage(messageEnum["server" + code]);
            }
            callback(data);
        });
    }

    static getWorkdays(stdate = new Date(), endate = new Date(), holidays = [], withSaturday = true) {
        var workdays = 0;
        var strDate = "";
        while (stdate <= endate) {
            strDate = stdate.toISOString().split('T')[0];
            if (stdate.getDay() != 0 && (withSaturday ? true : stdate.getDay() != 6) && holidays.indexOf(strDate) == -1) {
                workdays++;
            }
            stdate = new Date(stdate.getTime() + 86400000);
        }
        return workdays;
    }

    static removeSpecialCharacters(txt) {
        var r = txt.toLowerCase();
        r = r.replace(/[àáâãäå]/gi, "a");
        r = r.replace(/æ/gi, "ae");
        r = r.replace(/ç/gi, "c");
        r = r.replace(/[èéêë]/gi, "e");
        r = r.replace(/[ìíîï]/gi, "i");
        r = r.replace(/ñ/gi, "n");
        r = r.replace(/[òóôõö]/gi, "o");
        r = r.replace(/œ/gi, "oe");
        r = r.replace(/[ùúûü]/gi, "u");
        r = r.replace(/[ýÿ]/gi, "y");
        r = r.replace(/\ /gi, "_SPACE_");
        r = r.replace(/\W/gi, "");
        r = r.replace(/_SPACE_/gi, " ");
        return r;
    }

    static isUF(uf) {
        uf = uf.toUpperCase();
        var ufList = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];
        if (ufList.indexOf(uf.toUpperCase()) === -1) {
            return false;
        }
        return true;
    }

}

module.exports = exports = AppUtil;