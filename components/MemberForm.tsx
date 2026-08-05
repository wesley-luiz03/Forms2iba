'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Filho {
  nome: string;
  cpf: string;
  dataNascimento: string;
  genero: string;
  telefone: string;
  email: string;
  foiBatizado: string;
  tipoBatismo: string;
  igrejaBatismo: string;
  dataBatismo: string;
  batismoNaoRecordo: boolean;
  arrolamento: string;
}

interface EstadoIBGE {
  sigla: string;
  nome: string;
}

interface CidadeIBGE {
  nome: string;
}

const MINISTERIOS = [
  "Ministério de ação social",
  "Ministério de comunicação",
  "Ministério de evangelismo e missões",
  "Ministério de Intercessão",
  "Ministério de Louvor",
  "Ministério da 3ª idade",
  "Ministério da família",
  "Ministério da juventude",
  "Ministério infantil",
  "Ministério Mãos de Deus"
];

const FAQS = [
  {
    id: 1,
    pergunta: "Qual a diferença entre Membro e Congregante?",
    resposta: "O membro ativo passou pelo processo de Admissão formal e compõe o rol oficial da igreja no Eklesia. O Congregante participa regularmente dos cultos e atividades, sem possuir o vínculo de membresia formal ainda."
  },
  {
    id: 2,
    pergunta: "Por que os dados do meu cônjuge e filhos são criados sozinhos?",
    resposta: "Para simplificar o processo! Nosso sistema analisa os dados inseridos e ramifica a criação individual dos cadastros no banco de dados, mantendo toda a árvore familiar perfeitamente conectada para a secretaria."
  },
  {
    id: 3,
    pergunta: "Meus documentos estão seguros de acordo com a LGPD?",
    resposta: "Sim, absolutamente! A 2ª Igreja Batista de Areias assegura o sigilo criptografado de todas as informações familiares coletadas, utilizando os registros de forma exclusiva para a organização interna da membresia."
  },
  {
    id: 4,
    pergunta: "Não lembro a data exata do meu batismo, o que fazer?",
    resposta: "Não há problema. Basta marcar a caixa de seleção 'Não me recordo' localizada logo acima do campo de data. O sistema aceitará a homologação do formulário normalmente."
  }
];

// --- FUNÇÕES DE MÁSCARA E VALIDAÇÃO ---
const validarCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cleanCpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cleanCpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCpf.charAt(10))) return false;

  return true;
};

const validarDataBR = (dataBr: string): boolean => {
  if (!dataBr || dataBr.length !== 10) return false;
  const [diaStr, mesStr, anoStr] = dataBr.split('/');
  const dia = parseInt(diaStr, 10);
  const mes = parseInt(mesStr, 10);
  const ano = parseInt(anoStr, 10);

  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
  if (mes < 1 || mes > 12) return false;
  if (ano < 1900 || ano > new Date().getFullYear()) return false;

  const diasNoMes = new Date(ano, mes, 0).getDate();
  return dia >= 1 && dia <= diasNoMes;
};

export default function MemberForm({ customFields }: { customFields: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- TIPO DE FLUXO PRINCIPAL ---
  const [tipoFluxo, setTipoFluxo] = useState<'membro' | 'visitante' | null>(null);
  const [errorsByField, setErrorsByField] = useState<{ [key: string]: string }>({});
  const [aceitaTermosLgpd, setAceitaTermosLgpd] = useState(false);

  // FAQ Accordion
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  // --- ESTADOS DO TITULAR ---
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [orgaoExpedidor, setOrgaoExpedidor] = useState('');
  const [celular, setCellular] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  
  // Batismo (Titular - sem pergunta prévia de sim/não)
  const [tipoBatismo, setTipoBatismo] = useState('');
  const [igrejaBatismo, setIgrejaBatismo] = useState('');
  const [dataBatismo, setDataBatismo] = useState('');
  const [batismoNaoRecordo, setBatismoNaoRecordo] = useState(false);

  // Endereço
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');

  // Ficha Complementar
  const [escolaridade, setEscolaridade] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [isDoador, setIsDoador] = useState('');
  const [nomePai, setNomePai] = useState('');
  const [paiNaoConsta, setPaiNaoConsta] = useState(false);
  const [nomeMae, setNomeMae] = useState('');

  // Ministérios (Seleção Múltipla)
  const [fazParteMinisterio, setFazParteMinisterio] = useState('');
  const [qualMinisterioFazParte, setQualMinisterioFazParte] = useState<string[]>([]);
  const [querParticiparMinisterio, setQuerParticiparMinisterio] = useState('');
  const [qualMinisterioQuerParticipar, setQualMinisterioQuerParticipar] = useState<string[]>([]);
  const [respostasCustomizadas, setRespostasCustomizadas] = useState<{ [key: string]: any }>({});

  // --- ESTADOS DO CÔNJUGE COMPLETO ---
  const [conjugeNome, setConjugeNome] = useState('');
  const [conjugeGenero, setConjugeGenero] = useState('');
  const [conjugeNascimento, setConjugeNascimento] = useState('');
  const [conjugeCpf, setConjugeCpf] = useState('');
  const [conjugeRg, setConjugeRg] = useState('');
  const [conjugeOrgao, setConjugeOrgao] = useState('');
  const [conjugeCelular, setConjugeCelular] = useState('');
  const [conjugeEmail, setConjugeEmail] = useState('');
  const [conjugeEscolaridade, setConjugeEscolaridade] = useState('');
  const [conjugeSangue, setConjugeSangue] = useState('');
  const [conjugeDoador, setConjugeDoador] = useState('');
  const [conjugePai, setConjugePai] = useState('');
  const [conjugePaiNaoConsta, setConjugePaiNaoConsta] = useState(false);
  const [conjugeMae, setConjugeMae] = useState('');
  const [conjugeBatizado, setConjugeBatizado] = useState('');
  const [conjugeTipoBatismo, setConjugeTipoBatismo] = useState('');
  const [conjugeIgrejaBatismo, setConjugeIgrejaBatismo] = useState('');
  const [conjugeDataBatismo, setConjugeDataBatismo] = useState('');
  const [conjugeBatismoNaoRecordo, setConjugeBatismoNaoRecordo] = useState(false);
  const [conjugeArrolamento, setConjugeArrolamento] = useState('');
  const [conjugeDataUniao, setConjugeDataUniao] = useState('');

  // --- ESTADOS INDEPENDENTES DOS FILHOS ---
  const [possuiFilhos, setPossuiFilhos] = useState('');
  const [filhos, setFilhos] = useState<Filho[]>([
    { nome: '', cpf: '', dataNascimento: '', genero: '', telefone: '', email: '', foiBatizado: '', tipoBatismo: '', igrejaBatismo: '', dataBatismo: '', batismoNaoRecordo: false, arrolamento: 'FREQUENTADOR' }
  ]);

  // APIs IBGE
  const [listaEstados, setListaEstados] = useState<EstadoIBGE[]>([]);
  const [listaCidades, setListaCidades] = useState<string[]>([]);
  const [estadoNatural, setEstadoNatural] = useState('');
  const [cidadeNatural, setCidadeNatural] = useState('');
  const [carregandoCidades, setCarregandoCidades] = useState(false);

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?ordenar=nome')
      .then((res) => res.json())
      .then((data) => setListaEstados(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!estadoNatural) { setListaCidades([]); return; }
    setCarregandoCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoNatural}/municipios`)
      .then((res) => res.json())
      .then((data: CidadeIBGE[]) => {
        setListaCidades(data.map((c) => c.nome));
        setCarregandoCidades(false);
      })
      .catch(() => setCarregandoCidades(false));
  }, [estadoNatural]);

  // Preenchimento do ViaCEP
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setEndereco(data.logradouro || '');
            setBairro(data.bairro || '');
            setCidade(data.localidade || '');
            setUf(data.uf || '');
            setErrorsByField(prev => ({ ...prev, cep: '' }));
          } else {
            setErrorsByField(prev => ({ ...prev, cep: 'CEP não encontrado.' }));
          }
        }).catch(() => {});
    }
  }, [cep]);

  // MÁSCARAS DE FORMATÇÃO EM TEMPO DE DIGITAÇÃO
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(value);
  };

  const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>, setter: Function) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    if (value.length > 4) {
      value = `${value.slice(0, 1)}.${value.slice(1, 4)}.${value.slice(4)}`;
    } else if (value.length > 1) {
      value = `${value.slice(0, 1)}.${value.slice(1)}`;
    }
    setter(value);
  };

  const aplicarMascaraData = (value: string) => {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 8) clean = clean.slice(0, 8);
    if (clean.length >= 5) return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>, setter: Function) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setter(value);
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>, setter: Function) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    setter(value);
  };

  // MANIPULADOR DE SELEÇÃO MÚLTIPLA DE MINISTÉRIOS
  const toggleMinisterio = (
    ministerio: string, 
    listaAtual: string[], 
    setter: (novaLista: string[]) => void
  ) => {
    if (listaAtual.includes(ministerio)) {
      setter(listaAtual.filter(m => m !== ministerio));
    } else {
      setter([...listaAtual, ministerio]);
    }
  };

  // VALIDADOR INSTANTÂNEO DE CAMPOS (ON BLUR)
  const validarCampoEmTempoReal = (campo: string, valor: string) => {
    let msgErro = '';

    if (campo.startsWith('cpf')) {
      if (valor && !validarCPF(valor)) msgErro = 'CPF inválido.';
    } else if (campo.startsWith('data')) {
      if (valor && !validarDataBR(valor)) msgErro = 'Data inválida (DD/MM/AAAA).';
    } else if (campo.startsWith('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (valor && !emailRegex.test(valor)) msgErro = 'E-mail inválido.';
    } else if (campo.startsWith('celular')) {
      const clean = valor.replace(/\D/g, '');
      if (valor && clean.length < 10) msgErro = 'Celular incompleto.';
    }

    setErrorsByField(prev => ({ ...prev, [campo]: msgErro }));
  };

  const adicionarFilho = () => {
    setFilhos([...filhos, { nome: '', cpf: '', dataNascimento: '', genero: '', telefone: '', email: '', foiBatizado: '', tipoBatismo: '', igrejaBatismo: '', dataBatismo: '', batismoNaoRecordo: false, arrolamento: 'FREQUENTADOR' }]);
  };
  const removerFilho = (index: number) => {
    setFilhos(filhos.filter((_, i) => i !== index));
  };
  const atualizarFilho = (index: number, campo: keyof Filho, valor: any) => {
    const novosFilhos = [...filhos] as any[];
    novosFilhos[index][campo] = valor;
    setFilhos(novosFilhos);
  };

  const formatarParaISO = (dataBr: string) => {
    if (!dataBr || dataBr.length !== 10) return null;
    const [dia, mes, ano] = dataBr.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  function handleTriggerValidation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!aceitaTermosLgpd) { setError('Você precisa aceitar os termos da LGPD.'); return; }
    
    const temErrosVisiveis = Object.values(errorsByField).some(m => m !== '');
    if (temErrosVisiveis) {
      setError('Por favor, corrija os campos destacados em vermelho antes de enviar.');
      return;
    }

    if (!validarCPF(cpf)) { setError('O CPF digitado para o titular é inválido.'); return; }

    if (estadoCivil === 'Casado(a)') {
      if (!conjugeNome.trim()) { setError('Preencha os dados obrigatórios do cônjuge.'); return; }
      if (!validarCPF(conjugeCpf)) { setError('O CPF digitado para o cônjuge é inválido.'); return; }
    }

    if (possuiFilhos === 'Sim') {
      for (let i = 0; i < filhos.length; i++) {
        if (!validarCPF(filhos[i].cpf)) {
          setError(`O CPF do filho #${i + 1} (${filhos[i].nome || 'sem nome'}) é inválido.`);
          return;
        }
      }
    }

    // Validação de Batismo do Titular
    if (!batismoNaoRecordo && (!dataBatismo || dataBatismo.length !== 10)) {
      setError('A data do batismo do titular é obrigatória ou marque a opção "Não me recordo".');
      return;
    }

    // Validação da seleção de Ministérios para membros
    if (tipoFluxo === 'membro') {
      if (fazParteMinisterio === 'Sim' && qualMinisterioFazParte.length === 0) {
        setError('Por favor, selecione ao menos um ministério do qual você faz parte.');
        return;
      }
      if (fazParteMinisterio === 'Não' && querParticiparMinisterio === 'Sim' && qualMinisterioQuerParticipar.length === 0) {
        setError('Por favor, selecione ao menos um ministério que você gostaria de integrar.');
        return;
      }
    }

    ejecutarEnvioSupabase();
  }

  async function ejecutarEnvioSupabase() {
    setLoading(true);
    const supabase = createClient();
    const arrolamentoCalculado = tipoFluxo === 'membro' ? 'ADMISSÃO' : 'FREQUENTADOR';

    const batismoFinal = batismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(dataBatismo);

    const payloadMembro = {
      nome, genero, data_nascimento: formatarParaISO(dataNascimento),
      estado_civil: estadoCivil || 'Não informado', cpf: cpf || null, celular, email,
      cep, endereco, numero, complemento, bairro, cidade, uf,
      rg: rg || null, escolaridade: escolaridade || 'Não informado', tipo_sanguineo: tipoSanguineo || null,
      eh_doador: isDoador || null, naturalidade: cidadeNatural && estadoNatural ? `${cidadeNatural} - ${estadoNatural}` : null, 
      nome_pai: paiNaoConsta ? 'NÃO CONSTA' : nomePai, nome_mae: nomeMae, data_batismo: batismoFinal,
      arrolamento: arrolamentoCalculado,
      dados_familiares: {
        conjugeCompleto: estadoCivil === 'Casado(a)' ? {
          nome: conjugeNome, genero: conjugeGenero, dataNascimento: formatarParaISO(conjugeNascimento),
          cpf: conjugeCpf || null, rg: conjugeRg || null, orgaoExpedidor: conjugeOrgao || null,
          celular: conjugeCelular, email: conjugeEmail, escolaridade: conjugeEscolaridade,
          tipoSanguineo: conjugeSangue, isDoador: conjugeDoador, nomePai: conjugePaiNaoConsta ? 'NÃO CONSTA' : conjugePai,
          nomeMae: conjugeMae, foiBatizado: conjugeBatizado, tipoBatismo: conjugeTipoBatismo, igrejaBatismo: conjugeIgrejaBatismo,
          dataBatismo: conjugeBatismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(conjugeDataBatismo),
          arrolamento: conjugeArrolamento
        } : null,
        dataUniao: formatarParaISO(conjugeDataUniao),
        filhos: possuiFilhos === 'Sim' ? filhos.map(f => ({
          ...f, dataNascimento: formatarParaISO(f.dataNascimento), dataBatismo: f.batismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(f.dataBatismo)
        })) : []
      },
      campos_extra: {
        ...respostasCustomizadas, orgao_expedidor: orgaoExpedidor || null, ponto_referencia: pontoReferencia || null,
        igreja_batismo: igrejaBatismo || null, tipo_batismo: tipoBatismo || null, 
        faz_parte_ministerio: tipoFluxo === 'membro' ? fazParteMinisterio : null,
        qual_ministerio_faz_parte: tipoFluxo === 'membro' && fazParteMinisterio === 'Sim' ? qualMinisterioFazParte : null, 
        quer_participar_ministerio: tipoFluxo === 'membro' && fazParteMinisterio === 'Não' ? querParticiparMinisterio : null,
        qual_ministerio_quer_participar: tipoFluxo === 'membro' && fazParteMinisterio === 'Não' && querParticiparMinisterio === 'Sim' ? qualMinisterioQuerParticipar : null
      }
    };

    const { error: insError } = await supabase.from('membros').insert(payloadMembro);
    
    if (insError) { 
      // TRATAMENTO AMIGÁVEL PARA CPF DUPLICADO
      if (insError.message.includes('membros_cpf_unique') || insError.code === '23505') {
        setError('Este CPF já está cadastrado no sistema. Verifique os dados digitados ou entre em contato com a secretaria.');
      } else {
        setError(insError.message); 
      }
      setLoading(false); 
      return; 
    }

    router.push('/sucesso');
  }

  // --- SELETOR DE FLUXO INICIAL ---
  if (!tipoFluxo) {
    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-10 px-3 sm:px-4 animate-fadeIn">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-12 text-center space-y-6 backdrop-blur-xl">
          <div className="w-16 h-1.5 bg-iba-gold mx-auto rounded-full" />
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
              Seja bem-vindo(a) à 2IBA!
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              Para iniciarmos, selecione como você deseja realizar o seu cadastro hoje:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={() => setTipoFluxo('visitante')}
              className="group flex flex-col items-center justify-center p-6 sm:p-8 bg-neutral-50/80 dark:bg-neutral-800/40 border-2 border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:border-emerald-500 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-sm hover:shadow-lg text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-500 transition-colors">
                Sou Visitante / Congregante
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 sm:mt-2 leading-relaxed">
                Cadastro rápido e simplificado para visitantes e participantes de cultos.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTipoFluxo('membro')}
              className="group flex flex-col items-center justify-center p-6 sm:p-8 bg-neutral-50/80 dark:bg-neutral-800/40 border-2 border-neutral-200/80 dark:border-neutral-800 hover:border-iba-blue hover:bg-iba-blue/5 dark:hover:border-iba-blue rounded-2xl transition-all duration-300 transform active:scale-95 shadow-sm hover:shadow-lg text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-iba-blue/10 text-iba-blue rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-100 group-hover:text-iba-blue transition-colors">
                Sou Membro da 2IBA
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 sm:mt-2 leading-relaxed">
                Ficha completa necessária para homologação do seu registro oficial de membresia.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm outline-none focus:border-iba-blue focus:ring-2 focus:ring-iba-blue/10 transition-all duration-200 w-full placeholder:text-neutral-400";
  const inputErrorStyle = "border-red-500 focus:border-red-500 focus:ring-red-500/10";
  const labelStyle = "text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Banner Superior */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 flex justify-between items-center text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-none" />
          <span className="text-neutral-600 dark:text-neutral-400 text-[11px] sm:text-xs">
            Modo: <strong className="uppercase font-bold text-iba-blue">{tipoFluxo === 'membro' ? 'Membro Ativo' : 'Visitante / Congregante'}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setTipoFluxo(null)}
          className="text-red-500 hover:text-red-600 font-bold hover:underline transition-colors flex-none"
        >
          Trocar Modo
        </button>
      </div>

      <form onSubmit={handleTriggerValidation} className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden font-sans transition-all duration-300">
        
        {error && (
          <div className="mx-4 sm:mx-7 mt-5 sm:mt-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs sm:text-sm rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
            <svg className="w-5 h-5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* SEÇÃO 1: DADOS DO TITULAR */}
        <div className="p-5 sm:p-9 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-blue text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">1</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Dados Pessoais do Titular</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 sm:col-span-2">
              <label className={labelStyle}>Nome completo <span className="text-red-500">*</span></label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite seu nome completo" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Gênero <span className="text-red-500">*</span></label>
              <select required value={genero} onChange={(e) => setGenero(e.target.value)} className={inputStyle}>
                <option value="">Selecione…</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Data de nascimento <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required 
                maxLength={10} 
                placeholder="DD/MM/AAAA" 
                value={dataNascimento} 
                onChange={(e) => setDataNascimento(aplicarMascaraData(e.target.value))} 
                onBlur={(e) => validarCampoEmTempoReal('dataNascimento', e.target.value)}
                className={`${inputStyle} ${errorsByField.dataNascimento ? inputErrorStyle : ''}`} 
              />
              {errorsByField.dataNascimento && <span className="text-xs text-red-500 font-semibold">{errorsByField.dataNascimento}</span>}
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 sm:col-span-2">
              <label className={labelStyle}>Estado civil <span className="text-red-500">*</span></label>
              <select required value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className={inputStyle}>
                <option value="">Selecione…</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>
          </div>

          {/* FICHA DO CÔNJUGE (SE CASADO) */}
          {estadoCivil === 'Casado(a)' && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-8 bg-neutral-50/80 dark:bg-neutral-800/30 border-l-4 border-l-iba-blue border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-iba-blue tracking-tight">Ficha Cadastral do Cônjuge (Novo Cadastro Interligado)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 sm:col-span-2">
                  <label className={labelStyle}>Nome Completo do Cônjuge <span className="text-red-500">*</span></label>
                  <input type="text" required value={conjugeNome} onChange={(e) => setConjugeNome(e.target.value)} placeholder="Nome completo do esposo(a)" className={inputStyle} />
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>CPF do Cônjuge <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={conjugeCpf} 
                    onChange={(e) => handleCpfChange(e, setConjugeCpf)} 
                    onBlur={(e) => validarCampoEmTempoReal('conjugeCpf', e.target.value)}
                    placeholder="000.000.000-00" 
                    className={`${inputStyle} ${errorsByField.conjugeCpf ? inputErrorStyle : ''}`} 
                  />
                  {errorsByField.conjugeCpf && <span className="text-xs text-red-500 font-semibold">{errorsByField.conjugeCpf}</span>}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>Situação Eclesiástica dela(e) <span className="text-red-500">*</span></label>
                  <select required value={conjugeArrolamento} onChange={(e) => setConjugeArrolamento(e.target.value)} className={inputStyle}>
                    <option value="">Selecione…</option>
                    <option value="ADMISSÃO">Membro Ativo</option>
                    <option value="FREQUENTADOR">Congregante</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>Gênero do Cônjuge <span className="text-red-500">*</span></label>
                  <select required value={conjugeGenero} onChange={(e) => setConjugeGenero(e.target.value)} className={inputStyle}>
                    <option value="">Selecione…</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>Data de Nascimento do Cônjuge <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="DD/MM/AAAA" 
                    value={conjugeNascimento} 
                    onChange={(e) => setConjugeNascimento(aplicarMascaraData(e.target.value))} 
                    onBlur={(e) => validarCampoEmTempoReal('conjugeNascimento', e.target.value)}
                    className={`${inputStyle} ${errorsByField.conjugeNascimento ? inputErrorStyle : ''}`} 
                  />
                  {errorsByField.conjugeNascimento && <span className="text-xs text-red-500 font-semibold">{errorsByField.conjugeNascimento}</span>}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>Celular do Cônjuge <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={conjugeCelular} 
                    onChange={(e) => handleCelularChange(e, setConjugeCelular)} 
                    onBlur={(e) => validarCampoEmTempoReal('conjugeCelular', e.target.value)}
                    placeholder="(81) 99999-9999" 
                    className={`${inputStyle} ${errorsByField.conjugeCelular ? inputErrorStyle : ''}`} 
                  />
                  {errorsByField.conjugeCelular && <span className="text-xs text-red-500 font-semibold">{errorsByField.conjugeCelular}</span>}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 sm:col-span-2">
                  <label className={labelStyle}>E-mail do Cônjuge <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    required 
                    value={conjugeEmail} 
                    onChange={(e) => setConjugeEmail(e.target.value)} 
                    onBlur={(e) => validarCampoEmTempoReal('conjugeEmail', e.target.value)}
                    placeholder="conjuge@email.com" 
                    className={`${inputStyle} ${errorsByField.conjugeEmail ? inputErrorStyle : ''}`} 
                  />
                  {errorsByField.conjugeEmail && <span className="text-xs text-red-500 font-semibold">{errorsByField.conjugeEmail}</span>}
                </div>
                
                {/* Batismo do Cônjuge */}
                <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 sm:col-span-2 border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-2">
                  <label className={labelStyle}>O Cônjuge já foi batizado? <span className="text-red-500">*</span></label>
                  <select required value={conjugeBatizado} onChange={(e) => setConjugeBatizado(e.target.value)} className={inputStyle}>
                    <option value="">Selecione…</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                {conjugeBatizado === 'Sim' && (
                  <>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label className={labelStyle}>Tipo de Batismo <span className="text-red-500">*</span></label>
                      <select required value={conjugeTipoBatismo} onChange={(e) => setConjugeTipoBatismo(e.target.value)} className={inputStyle}>
                        <option value="">Selecione…</option>
                        <option value="Imersão">Imersão</option>
                        <option value="Aspersão">Aspersão</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label className={labelStyle}>Igreja do Batismo <span className="text-red-500">*</span></label>
                      <input type="text" required value={conjugeIgrejaBatismo} onChange={(e) => setConjugeIgrejaBatismo(e.target.value)} placeholder="Nome da igreja" className={inputStyle} />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 sm:col-span-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                        <label className={labelStyle}>
                          Data do Batismo do Cônjuge {!conjugeBatismoNaoRecordo && <span className="text-red-500">*</span>}
                        </label>
                        <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={conjugeBatismoNaoRecordo} onChange={(e) => setConjugeBatismoNaoRecordo(e.target.checked)} className="rounded text-iba-blue" />
                          Não me recordo
                        </label>
                      </div>
                      <input 
                        type="text" 
                        required={!conjugeBatismoNaoRecordo} 
                        disabled={conjugeBatismoNaoRecordo} 
                        maxLength={10} 
                        placeholder={conjugeBatismoNaoRecordo ? "Isento" : "DD/MM/AAAA"} 
                        value={conjugeBatismoNaoRecordo ? '' : conjugeDataBatismo} 
                        onChange={(e) => setConjugeDataBatismo(aplicarMascaraData(e.target.value))} 
                        onBlur={(e) => !conjugeBatismoNaoRecordo && validarCampoEmTempoReal('conjugeDataBatismo', e.target.value)}
                        className={`${inputStyle} disabled:opacity-50 ${errorsByField.conjugeDataBatismo ? inputErrorStyle : ''}`} 
                      />
                      {errorsByField.conjugeDataBatismo && <span className="text-xs text-red-500 font-semibold">{errorsByField.conjugeDataBatismo}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 2: NÚCLEO FAMILIAR E DEPENDENTES (TOTALMENTE INDEPENDENTE) */}
        <div className="p-5 sm:p-9 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-blue text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">2</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Núcleo Familiar</h3>
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className={labelStyle}>Possui filhos? <span className="text-red-500">*</span></label>
            <select required value={possuiFilhos} onChange={(e) => setPossuiFilhos(e.target.value)} className={inputStyle}>
              <option value="">Selecione…</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>

          {/* LISTA DE FILHOS */}
          {possuiFilhos === 'Sim' && (
            <div className="space-y-4 pt-5 mt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between items-center">
                <h5 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500">Filhos Cadastrados</h5>
                <button type="button" onClick={adicionarFilho} className="bg-iba-blue hover:bg-iba-dark text-white text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition-all shadow-sm active:scale-95">
                  + Adicionar Filho
                </button>
              </div>

              {filhos.map((filho, idx) => (
                <div key={idx} className="p-4 sm:p-5 bg-neutral-50/60 dark:bg-neutral-800/20 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-3.5 sm:space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200/80 dark:border-neutral-800">
                    <span className="text-xs font-bold text-iba-blue">Filho(a) {idx + 1}</span>
                    {filhos.length > 1 && (
                      <button type="button" onClick={() => removerFilho(idx)} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                      <label className={labelStyle}>Nome do Filho <span className="text-red-500">*</span></label>
                      <input type="text" required value={filho.nome} onChange={(e) => atualizarFilho(idx, 'nome', e.target.value)} placeholder="Nome completo" className={inputStyle} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelStyle}>CPF do Filho <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required 
                        value={filho.cpf} 
                        onChange={(e) => handleCpfChange(e, (v: string) => atualizarFilho(idx, 'cpf', v))} 
                        onBlur={(e) => validarCampoEmTempoReal(`filhoCpf_${idx}`, e.target.value)}
                        placeholder="000.000.000-00" 
                        className={`${inputStyle} ${errorsByField[`filhoCpf_${idx}`] ? inputErrorStyle : ''}`} 
                      />
                      {errorsByField[`filhoCpf_${idx}`] && <span className="text-xs text-red-500 font-semibold">{errorsByField[`filhoCpf_${idx}`]}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelStyle}>Data de Nascimento <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="DD/MM/AAAA" 
                        value={filho.dataNascimento} 
                        onChange={(e) => atualizarFilho(idx, 'dataNascimento', aplicarMascaraData(e.target.value))} 
                        onBlur={(e) => validarCampoEmTempoReal(`filhoDataNasc_${idx}`, e.target.value)}
                        className={`${inputStyle} ${errorsByField[`filhoDataNasc_${idx}`] ? inputErrorStyle : ''}`} 
                      />
                      {errorsByField[`filhoDataNasc_${idx}`] && <span className="text-xs text-red-500 font-semibold">{errorsByField[`filhoDataNasc_${idx}`]}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelStyle}>Gênero <span className="text-red-500">*</span></label>
                      <select required value={filho.genero} onChange={(e) => atualizarFilho(idx, 'genero', e.target.value)} className={inputStyle}>
                        <option value="">Selecione…</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelStyle}>Situação Eclesiástica <span className="text-red-500">*</span></label>
                      <select required value={filho.arrolamento} onChange={(e) => atualizarFilho(idx, 'arrolamento', e.target.value)} className={inputStyle}>
                        <option value="FREQUENTADOR">Congregante</option>
                        <option value="ADMISSÃO">Membro Ativo</option>
                      </select>
                    </div>

                    {/* Batismo do Filho */}
                    <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 border-t border-neutral-200 dark:border-neutral-800 pt-3 mt-1">
                      <label className={labelStyle}>O filho já foi batizado? <span className="text-red-500">*</span></label>
                      <select required value={filho.foiBatizado} onChange={(e) => atualizarFilho(idx, 'foiBatizado', e.target.value)} className={inputStyle}>
                        <option value="">Selecione…</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>

                    {filho.foiBatizado === 'Sim' && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelStyle}>Tipo de Batismo <span className="text-red-500">*</span></label>
                          <select required value={filho.tipoBatismo} onChange={(e) => atualizarFilho(idx, 'tipoBatismo', e.target.value)} className={inputStyle}>
                            <option value="">Selecione…</option>
                            <option value="Imersão">Imersão</option>
                            <option value="Aspersão">Aspersão</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className={labelStyle}>Igreja do Batismo <span className="text-red-500">*</span></label>
                          <input type="text" required value={filho.igrejaBatismo} onChange={(e) => atualizarFilho(idx, 'igrejaBatismo', e.target.value)} placeholder="Nome da igreja" className={inputStyle} />
                        </div>

                        <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                          <div className="flex justify-between items-center">
                            <label className={labelStyle}>
                              Data do Batismo {!filho.batismoNaoRecordo && <span className="text-red-500">*</span>}
                            </label>
                            <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={filho.batismoNaoRecordo} onChange={(e) => atualizarFilho(idx, 'batismoNaoRecordo', e.target.checked)} className="rounded text-iba-blue" />
                              Não me recordo
                            </label>
                          </div>
                          <input 
                            type="text" 
                            required={!filho.batismoNaoRecordo} 
                            disabled={filho.batismoNaoRecordo} 
                            maxLength={10} 
                            placeholder={filho.batismoNaoRecordo ? "Isento" : "DD/MM/AAAA"} 
                            value={filho.batismoNaoRecordo ? '' : filho.dataBatismo} 
                            onChange={(e) => atualizarFilho(idx, 'dataBatismo', aplicarMascaraData(e.target.value))} 
                            onBlur={(e) => !filho.batismoNaoRecordo && validarCampoEmTempoReal(`filhoDataBatismo_${idx}`, e.target.value)}
                            className={`${inputStyle} disabled:opacity-50 ${errorsByField[`filhoDataBatismo_${idx}`] ? inputErrorStyle : ''}`} 
                          />
                          {errorsByField[`filhoDataBatismo_${idx}`] && <span className="text-xs text-red-500 font-semibold">{errorsByField[`filhoDataBatismo_${idx}`]}</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEÇÃO 3: HISTÓRICO DE BATISMO (TITULAR) */}
        <div className="p-5 sm:p-9 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-blue text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">3</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Histórico de Batismo</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Tipo de Batismo <span className="text-red-500">*</span></label>
              <select required value={tipoBatismo} onChange={(e) => setTipoBatismo(e.target.value)} className={inputStyle}>
                <option value="">Selecione…</option>
                <option value="Imersão">Imersão</option>
                <option value="Aspersão">Aspersão</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Nome da Igreja do Batismo <span className="text-red-500">*</span></label>
              <input type="text" required value={igrejaBatismo} onChange={(e) => setIgrejaBatismo(e.target.value)} placeholder="Onde você foi batizado" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 sm:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                <label className={labelStyle}>
                  Data do Batismo {!batismoNaoRecordo && <span className="text-red-500">*</span>}
                </label>
                <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={batismoNaoRecordo} onChange={(e) => setBatismoNaoRecordo(e.target.checked)} className="rounded text-iba-blue" />
                  Não me recordo
                </label>
              </div>
              <input 
                type="text" 
                required={!batismoNaoRecordo} 
                disabled={batismoNaoRecordo} 
                maxLength={10} 
                placeholder={batismoNaoRecordo ? "Isento" : "DD/MM/AAAA"} 
                value={batismoNaoRecordo ? '' : dataBatismo} 
                onChange={(e) => setDataBatismo(aplicarMascaraData(e.target.value))} 
                onBlur={(e) => !batismoNaoRecordo && validarCampoEmTempoReal('dataBatismo', e.target.value)}
                className={`${inputStyle} disabled:opacity-50 ${errorsByField.dataBatismo ? inputErrorStyle : ''}`} 
              />
              {errorsByField.dataBatismo && <span className="text-xs text-red-500 font-semibold">{errorsByField.dataBatismo}</span>}
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: DOCUMENTAÇÕES E CONTATOS */}
        <div className="p-5 sm:p-9 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-blue text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">4</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Documentações e Contatos</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>
                CPF <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required 
                value={cpf} 
                onChange={(e) => handleCpfChange(e, setCpf)} 
                onBlur={(e) => validarCampoEmTempoReal('cpf', e.target.value)}
                placeholder="000.000.000-00" 
                className={`${inputStyle} ${errorsByField.cpf ? inputErrorStyle : ''}`} 
              />
              {errorsByField.cpf && <span className="text-xs text-red-500 font-semibold">{errorsByField.cpf}</span>}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className={labelStyle}>RG (Opcional)</label>
                <input 
                  type="text" 
                  value={rg} 
                  onChange={(e) => handleRgChange(e, setRg)} 
                  placeholder="0.000.000" 
                  className={inputStyle} 
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className={labelStyle}>Órgão Expedidor</label>
                <input type="text" placeholder="Ex: SDS/PE" value={orgaoExpedidor} onChange={(e) => setOrgaoExpedidor(e.target.value)} className={inputStyle} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Celular <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required 
                value={celular} 
                onChange={(e) => handleCelularChange(e, setCellular)} 
                onBlur={(e) => validarCampoEmTempoReal('celular', e.target.value)}
                placeholder="(81) 99999-9999" 
                className={`${inputStyle} ${errorsByField.celular ? inputErrorStyle : ''}`} 
              />
              {errorsByField.celular && <span className="text-xs text-red-500 font-semibold">{errorsByField.celular}</span>}
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>E-mail <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                onBlur={(e) => validarCampoEmTempoReal('email', e.target.value)}
                placeholder="exemplo@email.com" 
                className={`${inputStyle} ${errorsByField.email ? inputErrorStyle : ''}`} 
              />
              {errorsByField.email && <span className="text-xs text-red-500 font-semibold">{errorsByField.email}</span>}
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: ENDEREÇO RESIDENCIAL COMPLETO */}
        <div className="p-5 sm:p-9 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-blue text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">5</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Endereço Residencial</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>CEP <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required 
                maxLength={9} 
                value={cep} 
                onChange={handleCepChange} 
                placeholder="00000-000" 
                className={`${inputStyle} ${errorsByField.cep ? inputErrorStyle : ''}`} 
              />
              {errorsByField.cep && <span className="text-xs text-red-500 font-semibold">{errorsByField.cep}</span>}
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 sm:col-span-2">
              <label className={labelStyle}>Logradouro / Rua <span className="text-red-500">*</span></label>
              <input type="text" required value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Sua rua ou avenida" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Número <span className="text-red-500">*</span></label>
              <input type="text" required value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº da casa" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Complemento</label>
              <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, Bloco..." className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Bairro <span className="text-red-500">*</span></label>
              <input type="text" required value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Seu bairro" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 sm:col-span-2">
              <label className={labelStyle}>Cidade <span className="text-red-500">*</span></label>
              <input type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sua cidade" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Estado (UF) <span className="text-red-500">*</span></label>
              <input type="text" required maxLength={2} value={uf} onChange={(e) => setUf(e.target.value)} placeholder="PE" className={`${inputStyle} uppercase`} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 sm:col-span-3">
              <label className={labelStyle}>Ponto de Referência</label>
              <input type="text" value={pontoReferencia} onChange={(e) => setPontoReferencia(e.target.value)} placeholder="Próximo a mercado, praça..." className={inputStyle} />
            </div>
          </div>
        </div>

        {/* SEÇÃO 6: MINISTÉRIOS COM SELEÇÃO MÚLTIPLA */}
        {tipoFluxo === 'membro' && (
          <div className="p-5 sm:p-9 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/10 space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-blue text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">
                6
              </span>
              <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">
                Atuação Operacional e Ministérios
              </h3>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>
                Você faz parte de algum ministério da 2IBA? <span className="text-red-500">*</span>
              </label>
              <select 
                required 
                value={fazParteMinisterio} 
                onChange={(e) => {
                  setFazParteMinisterio(e.target.value);
                  setQualMinisterioFazParte([]);
                  setQuerParticiparMinisterio('');
                  setQualMinisterioQuerParticipar([]);
                }} 
                className={inputStyle}
              >
                <option value="">Selecione…</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            {fazParteMinisterio === 'Sim' && (
              <div className="space-y-3 animate-fadeIn border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <label className={labelStyle}>
                  De quais ministérios você participa atualmente? (Selecione um ou mais) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                  {MINISTERIOS.map((m) => {
                    const selecionado = qualMinisterioFazParte.includes(m);
                    return (
                      <label 
                        key={m} 
                        onClick={() => toggleMinisterio(m, qualMinisterioFazParte, setQualMinisterioFazParte)}
                        className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all select-none ${
                          selecionado 
                            ? 'border-iba-blue bg-iba-blue/10 text-iba-blue dark:bg-iba-blue/20 dark:text-white' 
                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={selecionado} 
                          readOnly 
                          className="rounded text-iba-blue focus:ring-iba-blue w-4 h-4 flex-none" 
                        />
                        <span>{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {fazParteMinisterio === 'Não' && (
              <div className="space-y-4 sm:space-y-5 animate-fadeIn border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>
                    Você deseja fazer parte de algum ministério? <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required 
                    value={querParticiparMinisterio} 
                    onChange={(e) => {
                      setQuerParticiparMinisterio(e.target.value);
                      setQualMinisterioQuerParticipar([]);
                    }} 
                    className={inputStyle}
                  >
                    <option value="">Selecione…</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>

                {querParticiparMinisterio === 'Sim' && (
                  <div className="space-y-3 animate-fadeIn pt-2">
                    <label className={labelStyle}>
                      Quais ministérios você gostaria de integrar? (Selecione um ou mais) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                      {MINISTERIOS.map((m) => {
                        const selecionado = qualMinisterioQuerParticipar.includes(m);
                        return (
                          <label 
                            key={m} 
                            onClick={() => toggleMinisterio(m, qualMinisterioQuerParticipar, setQualMinisterioQuerParticipar)}
                            className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all select-none ${
                              selecionado 
                                ? 'border-iba-blue bg-iba-blue/10 text-iba-blue dark:bg-iba-blue/20 dark:text-white' 
                                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={selecionado} 
                              readOnly 
                              className="rounded text-iba-blue focus:ring-iba-blue w-4 h-4 flex-none" 
                            />
                            <span>{m}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TERMO DE AUTORIZAÇÃO E CONSENTIMENTO COMPLETO (LGPD) */}
        <div className="p-5 sm:p-9 bg-neutral-50/80 dark:bg-neutral-800/20 border-b border-neutral-100 dark:border-neutral-800 space-y-4">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-neutral-200 dark:border-neutral-700">
            Termo de Autorização e Consentimento (LGPD - Lei nº 13.709/2018)
          </h4>
          
          <div className="max-h-[160px] overflow-y-auto text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 space-y-2.5 sm:space-y-3 pr-2 sm:pr-3 leading-relaxed bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 sm:p-4 rounded-xl shadow-inner">
            <p>
              Em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)</strong>, ao confirmar este cadastro, você autoriza expressamente que a <strong>2ª Igreja Batista de Areias (2IBA)</strong> realize a coleta e o tratamento dos seus dados pessoais e dos membros do seu núcleo familiar para fins exclusivos de gestão eclesiástica, atualização do rol de membros no sistema Eklesia, relatórios estatísticos internos, assistência pastoral e comunicações oficiais de atividades e cultos da igreja.
            </p>
            <p>
              <strong>Tratamento de Dados de Menores (Filhos/Dependentes):</strong> Na qualidade de pai, mãe ou responsável legal, você declara e concede o consentimento específico e em destaque (conforme o art. 14 da LGPD) para o cadastro e tratamento seguro dos dados pessoais de seus filhos e dependentes menores de idade incluídos nesta ficha.
            </p>
            <p>
              <strong>Uso Eventual de Imagem e Voz:</strong> Você declara estar ciente e autoriza o uso eventual de sua imagem e de seus dependentes em registros fotográficos ou audiovisuais realizados durante celebrações públicas e eventos promovidos pela igreja, destinados estritamente à divulgação institucional sem fins lucrativos em mídias sociais e canais oficiais.
            </p>
            <p>
              <strong>Segurança e Direitos do Titular:</strong> A 2IBA compromete-se a adotar medidas de segurança da informação para proteger seus dados, não compartilhando-os com terceiros para fins comerciais. Você poderá solicitar a confirmação, atualização ou revogação deste consentimento a qualquer momento junto à secretaria da igreja.
            </p>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input 
              type="checkbox" 
              id="aceitaTermosLgpd" 
              checked={aceitaTermosLgpd} 
              onChange={(e) => setAceitaTermosLgpd(e.target.checked)} 
              className="mt-0.5 w-4 h-4 rounded text-iba-blue focus:ring-iba-blue cursor-pointer flex-none" 
            />
            <label htmlFor="aceitaTermosLgpd" className="text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 select-none cursor-pointer leading-relaxed">
              Li o termo acima e <b>autorizo expressamente</b> a 2ª Igreja Batista de Areias a tratar os meus dados pessoais e de minha família em total conformidade com a LGPD.
            </label>
          </div>
        </div>

        {/* BOTÃO FINALIZAR CADASTRO */}
        <div className="p-5 sm:p-9 bg-neutral-50 dark:bg-neutral-800/40 flex justify-end border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-iba-blue hover:bg-iba-dark text-white font-bold text-sm px-9 py-4 rounded-xl shadow-lg shadow-iba-blue/10 transition-all duration-300 transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processando Cadastro...
              </span>
            ) : (
              'Finalizar Cadastro'
            )}
          </button>
        </div>
      </form>

      {/* FAQ ACCORDION INTERATIVO */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-8 shadow-md space-y-4 sm:space-y-5 transition-all duration-300">
        <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white pb-2.5 sm:pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
          Dúvidas e Perguntas Frequentes
        </h4>
        <div className="space-y-2.5 sm:space-y-3">
          {FAQS.map((faq) => {
            const isAberto = faqAberto === faq.id;
            return (
              <div key={faq.id} className="border border-neutral-200/80 dark:border-neutral-800 rounded-xl overflow-hidden transition-all bg-neutral-50/50 dark:bg-neutral-800/20">
                <button
                  type="button"
                  onClick={() => setFaqAberto(isAberto ? null : faq.id)}
                  className="w-full text-left p-3.5 sm:p-5 flex justify-between items-center gap-3 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">{faq.pergunta}</span>
                  <span className="p-1.5 sm:p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-500 flex-none shadow-sm">
                    <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isAberto ? 'rotate-180 text-iba-blue' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {isAberto && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-3 sm:pt-4 animate-fadeIn">
                    {faq.resposta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}