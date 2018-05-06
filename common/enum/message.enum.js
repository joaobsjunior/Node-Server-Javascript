const MESSAGES_ENUM = {
    /*TITLES*/
    titleErrorConsulta: "Erro na consulta SQL",
    /*MESSAGES SERVER*/
    server401: 'Acesso não autorizado',
    server403: 'Erro na autenticação, verifique os dados e tente novamente mais tarde',
    server412: 'Existem dados esperados que não foram recebidos pelo servidor',
    server422: 'Erro na execução do serviço',
    server500: 'O servidor não conseguiu completar sua requisição, verifique os dados enviados e tente novamente mais tarde.',
    /*MESSAGES SYSTEM*/
    msg01: 'Erro na autenticação',
    msg02: 'Campo com o tamanho diferente do esperado',
    msg03: 'Autenticado mas não autorizado',
    msgEmail: `
    <table width="100%" border="0" cellpadding="5" cellspacing="0" align="center" style="background-color:#e6e6e6;padding:25px;font-size:14px;font-family:'Trebuchet MS', Helvetica, sans-serif">
    <tr>
        <th width="150"></th>
        <th></th>
    </tr>
    <tr>
        <td scope="col" colspan="2" align="center">
            <img src="" style="width:220px" />
        </td>
    </tr>
    <tr>
        <td style="font-weight: bold;"><%= info1.label %>:</td>
        <td style="color:blue;font-family:Courier New;"><%= info1.txt %></td>
    </tr>
    <tr>
        <td style="font-weight: bold;"><%= info2.label %>:</td>
        <td style="color:red;font-family:Courier New;"><%= info2.txt %></td>
    </tr>
</table>
    `,
}
try {
    module.exports = exports = MESSAGES_ENUM;
} catch (e) {
    exports = MESSAGES_ENUM;
}