const MESSAGES_ENUM = {
    /*FIELDS*/
    fieldUsername: 'Login',
    fieldPassword: 'Senha',
    /*STATUS VOUCHERS*/
    EM: "Emitido",
    PP: "Parcialmente Pago",
    PT: "Totalmente Pago",
    /*TITLES*/
    titleErrorConsulta: "Erro na consulta SQL",
    /*MESSAGES SERVER*/
    server401: 'Acesso não autorizado',
    server403: 'Erro na autenticação, verifique os dados e tente novamente mais tarde',
    server412: 'Existem dados esperados que não foram recebidos pelo servidor',
    server422: 'Erro na execução do serviço',
    server500: 'Não foi possível completar sua requisição, verifique os dados enviados e tente novamente mais tarde.',
    /*MESSAGES SYSTEM*/
    msg01: 'Campo ${value} é obrigatório',
    msg02: 'Campo com o tamanho diferente do esperado',
    msg03: 'O campo informado não é válido',
    msg04: 'O campo deve ser maior que 3 letras',
    msg05: 'A data inicial não pode ser maior que a data final',
    msg06: 'Autenticado mas não autorizado',
    msg07: 'Erro na autenticação',
    msg08: 'Autenticado e autorizado',
    msg09: 'Loja informada não cadastrada',
    msg10: 'Gerente informado não cadastrado',
    msg11: 'Marca informada não cadastrada',
    msg12: 'Não é possível alterar/cadastrar a loja pois já existe outra loja com os dados informados',
    msg13: 'Usuário não encontrado no servidor corporativo AD. Abra um chamado para esclarecimentos.',
    msg14: 'Departamento informado não cadastrado',
    msg15: 'Não é possível cadastrar/atualizar os dados pois não existe registros na base antes de junho de 2017',
    msg16: 'Não é possível cadastrar/atualizar os dados pois o periodo informado é superior ao permitido (12 meses)',
    msg17: 'Não é possível cadastrar/atualizar os dados pois a quantidade de iterações informada é superior ao permitido (12 meses)',
    msg18: 'A data final não pode ser maior que a data atual e o intervalo deve ser menor ou igual a 60 dias',
    msg19: 'No momento não é possível realizar uma integração pois já existe um processo de integração em andamento solicitado por "${ username }". Tente novamente mais tarde.',
    msg20: 'Esta operação só é permitida no horário comercial',
    msg21: 'Legado informado não cadastrado',
    msg22: 'Não foi possível buscar numerador de cliente',
    msg23: 'CPF/CNPJ já cadastrado',
    msg24: 'Item não pode ser cadastrado',
    msg25: 'Usuário informado não é um vendedor',
    msg26: 'Ocorreu um erro na consulta ao banco de dados',
    msg27: 'CPF/CNPJ inválido',
    msg28: 'E-mail inválido',
    msg29: 'Não foi encontrado dados para leitura',
    msg30: 'Técnico não encontrado',
    msg31: 'Cliente não encontrado',
    msg32: 'Operação negada. Não podem existir valores duplicados em nossa base',
    msg33: 'Não foi possível realizar o cadastro do contato no banco de dados',
    msg34: 'Não foi possível realizar o cadastro de providência no banco de dados',
    msg35: 'Não foi possível realizar o cadastro de atendimento no banco de dados',
    msg36: 'Não foi possível realizar o cadastro da solicitação no banco de dados',
    msg37: 'O dia e horário solicitado não está mais disponível. Tente novamente com outro horário.',
    msg38: 'Já existe agendamento do veículo informado para esta data',
    msg39: 'Já existe um token válido criado nas últimas 24 horas para este usuário, por favor acesse seu e-mail para utiliza-lo.',
    msg40: 'Não foi encontrado nenhum e-mail cadastrado para o cliente informado. Por favor entre em contato com o financeiro para cadastrar o e-mail.',
    msg41: 'Até o momento não foi identificada nenhuma nota fiscal para o número informado. As notas fiscais podem demorar até 24 horas para serem exibidas no sistema, caso já se passou este período, por favor entre em contato com o financeiro.',
    msg42: 'Não foi possível realizar o cadastro do token no banco de dados',
    msg43: 'Não foi possível enviar o e-mail no momento. Tente novamente mais tarde.',
    msg44: 'O token informado não existe ou já foi utilizado anteriormente. Por favor solicite um novo token.',
    msg45: 'Não é possível cadastrar/atualizar os dados pois há registros informados que não foram localizados em nossa base de dados',
    msg46: 'Não foi possível remover os dados em nossa base de dados',
    msg47: 'Feriado informado não cadastrado.',
    msg48: 'Não é possível alterar/cadastrar o feriado pois já existe outro feriado com os dados informados',
    msg49: 'Feriado não localizado.',
    msg50: 'Tipo de feriado não encontrado. Informe um tipo de feriado válido.',
    msg51: 'Estado não encontrado. Informe um id de estado válido.',
    msg52: 'Cidade não encontrada. Informe um id de cidade válido.',    
    msg53: 'Data inválida. Informe uma data válida.',
    msg54: 'Feriado não localizado para este estado.',
    msg55: 'Feriado não localizado para esta cidade.',
    msgEmail: `
    <table width="100%" border="0" cellpadding="5" cellspacing="0" align="center" style="background-color:#e6e6e6;padding:25px;font-size:14px;font-family:'Trebuchet MS', Helvetica, sans-serif">
    <tr>
        <th width="150"></th>
        <th></th>
    </tr>
    <tr>
        <td scope="col" colspan="2" align="center">
            <img src="http://www.grupognc.com.br/gnc/images/logo-grupognc-small.png" style="width:220px" />
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