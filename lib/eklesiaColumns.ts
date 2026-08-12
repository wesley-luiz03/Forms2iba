export interface Membro {
  id: string;
  nome?: string;
  genero?: string;
  data_nascimento?: string;
  estado_civil?: string;
  cpf?: string;
  rg?: string;
  celular?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  nome_pai?: string;
  nome_mae?: string;
  data_batismo?: string;
  arrolamento?: string;
  dados_familiares?: any;
  campos_extra?: any;
  created_at?: string;
}

export function formatarMembrosParaExcel(membros: Membro[]) {
  if (!membros || membros.length === 0) return [];

  return membros.map((m) => {
    // Trata objetos JSON de forma segura
    const familiares = typeof m.dados_familiares === 'string' 
      ? JSON.parse(m.dados_familiares || '{}') 
      : (m.dados_familiares || {});

    const extras = typeof m.campos_extra === 'string' 
      ? JSON.parse(m.campos_extra || '{}') 
      : (m.campos_extra || {});

    const conjuge = familiares.conjugeCompleto || {};
    const filhos = Array.isArray(familiares.filhos) ? familiares.filhos : [];

    // Formata nomes de filhos para exibição resumida na mesma linha
    const nomesFilhos = filhos.map((f: any) => f.nome).filter(Boolean).join('; ');

    return {
      'Nome Completo': m.nome || '',
      'Tipo de Vínculo': m.arrolamento === 'ADMISSÃO' ? 'Membro Ativo' : 'Visitante / Congregante',
      'Gênero': m.genero || '',
      'Data de Nascimento': m.data_nascimento || '',
      'CPF': m.cpf || '',
      'RG': m.rg || '',
      'Órgão Expedidor': extras.orgao_expedidor || '',
      'Celular / WhatsApp': m.celular || '',
      'E-mail': m.email || '',
      'Estado Civil': m.estado_civil || '',
      'Nome do Pai': m.nome_pai || '',
      'Nome da Mãe': m.nome_mae || '',
      'Igreja do Batismo': extras.igreja_batismo || '',
      'Data do Batismo': m.data_batismo || '',
      'CEP': m.cep || '',
      'Logradouro': m.endereco || '',
      'Número': m.numero || '',
      'Complemento': m.complemento || '',
      'Bairro': m.bairro || '',
      'Cidade': m.cidade || '',
      'UF': m.uf || '',
      'Ponto de Referência': extras.ponto_referencia || '',
      // Cônjuge
      'Nome do Cônjuge': conjuge.nome || '',
      'CPF do Cônjuge': conjuge.cpf || '',
      'Celular do Cônjuge': conjuge.celular || '',
      'Batizado (Cônjuge)': conjuge.foiBatizado || '',
      'Data Batismo (Cônjuge)': conjuge.dataBatismo || '',
      // Filhos
      'Possui Filhos': filhos.length > 0 ? 'Sim' : 'Não',
      'Quantidade de Filhos': filhos.length,
      'Nomes dos Filhos': nomesFilhos,
      // Ministérios
      'Faz Parte de Ministério': extras.faz_parte_ministerio || '',
      'Ministérios Atuais': Array.isArray(extras.qual_ministerio_faz_parte) 
        ? extras.qual_ministerio_faz_parte.join('; ') 
        : (extras.qual_ministerio_faz_parte || ''),
      'Quer Participar de Ministério': extras.quer_participar_ministerio || '',
      'Ministérios de Interesse': Array.isArray(extras.qual_ministerio_quer_participar) 
        ? extras.qual_ministerio_quer_participar.join('; ') 
        : (extras.qual_ministerio_quer_participar || ''),
      // Data do Cadastro
      'Data do Cadastro': m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : ''
    };
  });
}