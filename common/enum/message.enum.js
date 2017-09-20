const MESSAGES_ENUM = {
    /*MESSAGES SERVER*/
    server401: 'Acesso não autorizado',
    server403: 'Erro na autenticação, verifique os dados e tente novamente mais tarde',
    server412: 'Existem dados esperados que não foram recebidos pelo servidor',
    server422: 'Erro na execução do serviço',
    server500: 'Não foi possível completar sua requisição, verifique os dados enviados e tente novamente mais tarde.',
    /*MESSAGES SYSTEM*/
    msg01: 'Campo ${value} é obrigatório',
}
try {
    module.exports = exports = MESSAGES_ENUM;
} catch (e) {
    exports = MESSAGES_ENUM;
}