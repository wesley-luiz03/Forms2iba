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
  emailNaoSeAplica: boolean;
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

interface MinisterioInfo {
  nome: string;
  tag: string;
  icone: string;
  destaque?: boolean;
}

const LISTA_MINISTERIOS: MinisterioInfo[] = [
  { nome: "Ministério Administrativo", tag: "Gestão e Estrutura", icone: "briefcase" },
  { nome: "Ministério da 3ª idade", tag: "Cuidado e Maturidade", icone: "sun" },
  { nome: "Ministério da Família", tag: "Lares e Casais", icone: "home", destaque: true },
  { nome: "Ministério da Juventude", tag: "Jovens e Adolescentes", icone: "zap" },
  { nome: "Ministério de Ação social", tag: "Assistência e Amor", icone: "heart" },
  { nome: "Ministério de Artes Gráficas", tag: "Design e Criatividade", icone: "palette" },
  { nome: "Ministério de Comunicação", tag: "Mídias e Transmissão", icone: "radio" },
  { nome: "Ministério de Educação Religiosa", tag: "Ensino Bíblico e EBD", icone: "book", destaque: true },
  { nome: "Ministério de Evangelismo e Missões", tag: "Expansão e Ide", icone: "compass", destaque: true },
  { nome: "Ministério de Intercessão", tag: "Oração Contínua", icone: "flame" },
  { nome: "Ministério de Louvor", tag: "Música e Adoração", icone: "music" },
  { nome: "Ministério Diaconal", tag: "Serviço e Apoio aos Cultos", icone: "users" },
  { nome: "Ministério Infantil", tag: "Ensino para Crianças", icone: "smile" },
  { nome: "Ministério Mãos de Deus", tag: "Acolhimento e Serviço", icone: "shield" },
];

const FAQS = [
  {
    id: 1,
    pergunta: "Qual a diferença entre Membro e Congregante?",
    resposta: "O membro ativo passou pelo processo de Admissão formal e compõe o rol oficial da igreja no Eklesia. O Congregante participa regularmente dos cultos e atividades, sem possuir o vínculo de membresia formal ainda."
  },
  {
    id: 2,
    pergunta: "Por que os dados do meu cônjuge e filhos são vinculados à minha ficha?",
    resposta: "Para garantir a conexão e integridade da sua família na secretaria. Cada membro da família com CPF ou que deseje informar seus próprios ministérios também pode preencher sua ficha individual a qualquer momento sem bloqueios."
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

const renderIconeMinisterio = (icone: string) => {
  switch (icone) {
    case 'briefcase':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
    case 'sun':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />;
    case 'home':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
    case 'zap':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />;
    case 'heart':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />;
    case 'palette':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4 11.042 11.042 0 014.28-8.8A9.98 9.98 0 0112 6c4.418 0 8 3.582 8 8 0 1.657-1.343 3-3 3h-2a2 2 0 00-2 2c0 1.105-.895 2-2 2H7z" />;
    case 'radio':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 8.464a5 5 0 000 7.072m-2.828-9.9a9 9 0 000 12.728M12 12h.01" />;
    case 'book':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />;
    case 'compass':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
    case 'flame':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.344 5.657 7.975 7.975 0 01-2.343 5.657z" />;
    case 'music':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />;
    case 'users':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
    case 'smile':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
    default:
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
  }
};

const validarCPF = (cpf: string): boolean => {
  if (!cpf) return true;
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length === 0) return true;
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

export default function MemberForm({ customFields }: { customFields?: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- TIPO DE FLUXO PRINCIPAL ---
  const [tipoFluxo, setTipoFluxo] = useState<'membro' | 'congregante' | null>(null);
  const [errorsByField, setErrorsByField] = useState<{ [key: string]: string }>({});
  const [aceitaTermosLgpd, setAceitaTermosLgpd] = useState(false);

  // FAQ Accordion
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  // --- ESTADOS DO TITULAR ---
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [estadoCivil, setEstadoCivil] = useState('Solteiro(a)');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [orgaoExpedidor, setOrgaoExpedidor] = useState('');
  const [celular, setCellular] = useState('');
  const [email, setEmail] = useState('');
  const [emailNaoSeAplica, setEmailNaoSeAplica] = useState(false);
  const [dataNascimento, setDataNascimento] = useState('');

  // Filiação do Titular
  const [nomePai, setNomePai] = useState('');
  const [paiNaoConsta, setPaiNaoConsta] = useState(false);
  const [nomeMae, setNomeMae] = useState('');

  // Batismo (Titular) -> Começa desmarcado (null)
  const [titularBatizado, setTitularBatizado] = useState<'Sim' | 'Não' | null>(null);
  const [igrejaBatismo, setIgrejaBatismo] = useState('');
  const [dataBatismo, setDataBatismo] = useState('');
  const [batismoNaoRecordo, setBatismoNaoRecordo] = useState(false);

  // Endereço
  const [cep, setCep] = useState('');
  const [carregandoCep, setCarregandoCep] = useState(false);
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

  // Ministérios -> Começam desmarcados (null)
  const [fazParteMinisterio, setFazParteMinisterio] = useState<'Sim' | 'Não' | null>(null);
  const [qualMinisterioFazParte, setQualMinisterioFazParte] = useState<string[]>([]);
  const [querParticiparMinisterio, setQuerParticiparMinisterio] = useState<'Sim' | 'Não' | null>(null);
  const [qualMinisterioQuerParticipar, setQualMinisterioQuerParticipar] = useState<string[]>([]);
  const [respostasCustomizadas, setRespostasCustomizadas] = useState<{ [key: string]: any }>({});

  // --- ESTADOS DO CÔNJUGE ---
  const [conjugeNome, setConjugeNome] = useState('');
  const [conjugeGenero, setConjugeGenero] = useState('Feminino');
  const [conjugeNascimento, setConjugeNascimento] = useState('');
  const [conjugeCpf, setConjugeCpf] = useState('');
  const [conjugeRg, setConjugeRg] = useState('');
  const [conjugeOrgao, setConjugeOrgao] = useState('');
  const [conjugeCelular, setConjugeCelular] = useState('');
  const [conjugeEmail, setConjugeEmail] = useState('');
  const [conjugeEmailNaoSeAplica, setConjugeEmailNaoSeAplica] = useState(false);
  const [conjugeEscolaridade, setConjugeEscolaridade] = useState('');
  const [conjugeSangue, setConjugeSangue] = useState('');
  const [conjugeDoador, setConjugeDoador] = useState('');
  const [conjugePai, setConjugePai] = useState('');
  const [conjugePaiNaoConsta, setConjugePaiNaoConsta] = useState(false);
  const [conjugeMae, setConjugeMae] = useState('');
  const [conjugeBatizado, setConjugeBatizado] = useState<'Sim' | 'Não' | null>(null);
  const [conjugeTipoBatismo, setConjugeTipoBatismo] = useState('Imersão');
  const [conjugeIgrejaBatismo, setConjugeIgrejaBatismo] = useState('');
  const [conjugeDataBatismo, setConjugeDataBatismo] = useState('');
  const [conjugeBatismoNaoRecordo, setConjugeBatismoNaoRecordo] = useState(false);
  const [conjugeArrolamento, setConjugeArrolamento] = useState('ADMISSÃO');
  const [conjugeDataUniao, setConjugeDataUniao] = useState('');

  // --- ESTADOS DOS FILHOS ---
  const [possuiFilhos, setPossuiFilhos] = useState<'Sim' | 'Não' | null>(null);
  const [filhos, setFilhos] = useState<Filho[]>([
    { nome: '', cpf: '', dataNascimento: '', genero: 'Masculino', telefone: '', email: '', emailNaoSeAplica: false, foiBatizado: '', tipoBatismo: 'Imersão', igrejaBatismo: '', dataBatismo: '', batismoNaoRecordo: false, arrolamento: 'FREQUENTADOR' }
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
      setCarregandoCep(true);
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
          setCarregandoCep(false);
        }).catch(() => setCarregandoCep(false));
    }
  }, [cep]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = `${value.slice(0, 5)}-${value.slice(5)}`;
    setCep(value);
  };

  const handleRgChange = (e: React.ChangeEvent<HTMLInputElement>, setter: Function) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    if (value.length > 4) value = `${value.slice(0, 1)}.${value.slice(1, 4)}.${value.slice(4)}`;
    else if (value.length > 1) value = `${value.slice(0, 1)}.${value.slice(1)}`;
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
    setFilhos([...filhos, { nome: '', cpf: '', dataNascimento: '', genero: 'Masculino', telefone: '', email: '', emailNaoSeAplica: false, foiBatizado: '', tipoBatismo: 'Imersão', igrejaBatismo: '', dataBatismo: '', batismoNaoRecordo: false, arrolamento: 'FREQUENTADOR' }]);
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

    const rolarParaOErro = (msg: string) => {
      setError(msg);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (!aceitaTermosLgpd) { 
      rolarParaOErro('Você precisa aceitar os termos da LGPD.'); 
      return; 
    }
    
    const temErrosVisiveis = Object.values(errorsByField).some(m => m !== '');
    if (temErrosVisiveis) {
      rolarParaOErro('Por favor, corrija os campos destacados em vermelho antes de enviar.');
      return;
    }

    if (!cpf || !validarCPF(cpf)) { 
      rolarParaOErro('O CPF digitado para o titular é obrigatório e precisa ser válido.'); 
      return; 
    }

    if (!emailNaoSeAplica && (!email || errorsByField.email)) {
      rolarParaOErro('O e-mail do titular é obrigatório ou marque a opção "Não se aplica".');
      return;
    }

    if (estadoCivil === 'Casado(a)') {
      if (!conjugeNome.trim()) { 
        rolarParaOErro('Preencha o nome do cônjuge.'); 
        return; 
      }
      if (conjugeCpf && !validarCPF(conjugeCpf)) { 
        rolarParaOErro('O CPF digitado para o cônjuge é inválido.'); 
        return; 
      }
      if (!conjugeEmailNaoSeAplica && (!conjugeEmail || errorsByField.conjugeEmail)) {
        rolarParaOErro('O e-mail do cônjuge é obrigatório ou marque a opção "Não se aplica".');
        return;
      }
      if (!conjugeBatizado) {
        rolarParaOErro('Por favor, indique se o seu cônjuge já foi batizado (Sim ou Não).');
        return;
      }
    }

    if (!possuiFilhos) {
      rolarParaOErro('Por favor, indique se você possui filhos ou dependentes (Sim ou Não).');
      return;
    }

    if (possuiFilhos === 'Sim') {
      for (let i = 0; i < filhos.length; i++) {
        if (filhos[i].cpf && !validarCPF(filhos[i].cpf)) {
          rolarParaOErro(`O CPF do filho #${i + 1} (${filhos[i].nome || 'sem nome'}) é inválido.`);
          return;
        }
        if (!filhos[i].foiBatizado) {
          rolarParaOErro(`Por favor, indique se o filho #${i + 1} (${filhos[i].nome || 'sem nome'}) é batizado.`);
          return;
        }
      }
    }

    if (!titularBatizado) {
      rolarParaOErro('Por favor, informe na Seção 3 se você já foi batizado (Sim ou Não).');
      return;
    }

    if (titularBatizado === 'Sim') {
      if (!batismoNaoRecordo && (!dataBatismo || dataBatismo.length !== 10)) {
        rolarParaOErro('A data do batismo do titular é obrigatória ou marque a opção "Não me recordo".');
        return;
      }
    }

    if (tipoFluxo === 'membro') {
      if (!fazParteMinisterio) {
        rolarParaOErro('Por favor, informe na Seção 6 se você faz parte de algum ministério atualmente.');
        return;
      }
      if (fazParteMinisterio === 'Sim' && qualMinisterioFazParte.length === 0) {
        rolarParaOErro('Por favor, selecione ao menos um ministério do qual você faz parte.');
        return;
      }
      if (fazParteMinisterio === 'Não') {
        if (!querParticiparMinisterio) {
          rolarParaOErro('Por favor, informe se você gostaria de integrar algum ministério.');
          return;
        }
        if (querParticiparMinisterio === 'Sim' && qualMinisterioQuerParticipar.length === 0) {
          rolarParaOErro('Por favor, selecione ao menos um ministério que você gostaria de integrar.');
          return;
        }
      }
    }

    ejecutarEnvioSupabase();
  }

  // ENVIO REESTRUTURADO (OPÇÃO A): Salva apenas 1 registro único do Titular
  async function ejecutarEnvioSupabase() {
    setLoading(true);
    const supabase = createClient();
    const arrolamentoCalculado = tipoFluxo === 'membro' ? 'ADMISSÃO' : 'FREQUENTADOR';

    let batismoFinal: string | null = null;
    if (titularBatizado === 'Sim') {
      batismoFinal = batismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(dataBatismo);
    } else {
      batismoFinal = 'NÃO BATIZADO';
    }

    const emailFinal = emailNaoSeAplica ? 'NÃO SE APLICA' : email;

    // Constrói o payload com dados familiares guardados como metadados aninhados
    const payloadMembro = {
      nome, 
      genero, 
      data_nascimento: formatarParaISO(dataNascimento),
      estado_civil: estadoCivil || 'Não informado', 
      cpf: cpf || null, 
      celular, 
      email: emailFinal,
      cep, 
      endereco, 
      numero, 
      complemento, 
      bairro, 
      cidade, 
      uf,
      rg: rg || null, 
      escolaridade: escolaridade || 'Não informado', 
      tipo_sanguineo: tipoSanguineo || null,
      eh_doador: isDoador || null, 
      naturalidade: cidadeNatural && estadoNatural ? `${cidadeNatural} - ${estadoNatural}` : null, 
      nome_pai: paiNaoConsta ? 'NÃO CONSTA' : nomePai, 
      nome_mae: nomeMae, 
      data_batismo: batismoFinal,
      arrolamento: arrolamentoCalculado,
      dados_familiares: {
        conjugeCompleto: estadoCivil === 'Casado(a)' ? {
          nome: conjugeNome, 
          genero: conjugeGenero, 
          dataNascimento: formatarParaISO(conjugeNascimento),
          cpf: conjugeCpf || null, 
          rg: conjugeRg || null, 
          orgaoExpedidor: conjugeOrgao || null,
          celular: conjugeCelular, 
          email: conjugeEmailNaoSeAplica ? 'NÃO SE APLICA' : conjugeEmail, 
          escolaridade: conjugeEscolaridade,
          tipoSanguineo: conjugeSangue, 
          isDoador: conjugeDoador, 
          nomePai: conjugePaiNaoConsta ? 'NÃO CONSTA' : conjugePai,
          nomeMae: conjugeMae, 
          foiBatizado: conjugeBatizado || 'Não informado', 
          tipoBatismo: conjugeTipoBatismo, 
          igrejaBatismo: conjugeIgrejaBatismo,
          dataBatismo: conjugeBatismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(conjugeDataBatismo),
          arrolamento: conjugeArrolamento
        } : null,
        dataUniao: formatarParaISO(conjugeDataUniao),
        filhos: possuiFilhos === 'Sim' ? filhos.map(f => ({
          ...f, 
          email: f.emailNaoSeAplica ? 'NÃO SE APLICA' : f.email,
          dataNascimento: formatarParaISO(f.dataNascimento), 
          dataBatismo: f.batismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(f.dataBatismo)
        })) : []
      },
      campos_extra: {
        ...respostasCustomizadas, 
        orgao_expedidor: orgaoExpedidor || null, 
        ponto_referencia: pontoReferencia || null,
        foi_batizado: titularBatizado,
        igreja_batismo: titularBatizado === 'Sim' ? (igrejaBatismo || null) : null, 
        faz_parte_ministerio: tipoFluxo === 'membro' ? fazParteMinisterio : null,
        qual_ministerio_faz_parte: tipoFluxo === 'membro' && fazParteMinisterio === 'Sim' ? qualMinisterioFazParte : null, 
        quer_participar_ministerio: tipoFluxo === 'membro' && fazParteMinisterio === 'Não' ? querParticiparMinisterio : null,
        qual_ministerio_quer_participar: tipoFluxo === 'membro' && fazParteMinisterio === 'Não' && querParticiparMinisterio === 'Sim' ? qualMinisterioQuerParticipar : null
      }
    };

    // Insere exclusivamente a ficha do Titular
    const { error: insError } = await supabase.from('membros').insert(payloadMembro);
    
    if (insError) { 
      if (insError.message.includes('membros_cpf_unique') || insError.code === '23505') {
        setError('Este CPF já está cadastrado no sistema. Verifique os dados digitados ou entre em contato com a secretaria.');
      } else {
        setError(insError.message); 
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setLoading(false); 
      return; 
    }

    router.push('/sucesso');
  }

  const renderFaqSection = () => (
    <div className="bg-white/80 dark:bg-iba-darkCard/80 backdrop-blur-md border border-iba-sand/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-5 transition-all duration-300">
      <div className="flex items-center gap-2.5 pb-2.5 sm:pb-3 border-b border-iba-sand/50 dark:border-neutral-800">
        <span className="w-2.5 h-2.5 rounded-full bg-iba-green animate-pulse" />
        <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
          Dúvidas e Perguntas Frequentes
        </h4>
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {FAQS.map((faq) => {
          const isAberto = faqAberto === faq.id;
          return (
            <div key={faq.id} className="border border-iba-sand/80 dark:border-neutral-800 rounded-xl overflow-hidden transition-all bg-iba-cream/20 dark:bg-neutral-800/20">
              <button
                type="button"
                onClick={() => setFaqAberto(isAberto ? null : faq.id)}
                className="w-full text-left p-3.5 sm:p-5 flex justify-between items-center gap-3 hover:bg-iba-cream/50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
              >
                <span className="font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">{faq.pergunta}</span>
                <span className="p-1.5 sm:p-2 bg-white dark:bg-neutral-800 border border-iba-sand dark:border-neutral-700 rounded-lg text-neutral-500 flex-none shadow-sm">
                  <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isAberto ? 'rotate-180 text-iba-green' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {isAberto && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-iba-sand/40 dark:border-neutral-800/60 pt-3 sm:pt-4 animate-fadeIn">
                  {faq.resposta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!tipoFluxo) {
    return (
      <div className="w-full max-w-[1400px] mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn font-sans">
        <div className="bg-white/90 dark:bg-iba-darkCard/90 border border-iba-sand/80 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-12 text-center space-y-6 backdrop-blur-xl">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-white dark:bg-neutral-800 shadow-md border-2 border-iba-sand flex items-center justify-center p-2 overflow-hidden">
            <img
              src="/logo-2iba.png"
              alt="Logo 2IBA"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
              Seja bem-vindo(a) à 2IBA!
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              Para iniciarmos, selecione como você deseja realizar o seu cadastro hoje:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => setTipoFluxo('congregante')}
              className="group relative flex flex-col items-center justify-center p-6 sm:p-8 bg-iba-cream/30 dark:bg-neutral-800/40 border-2 border-iba-sand/70 dark:border-neutral-800 hover:border-iba-green hover:bg-iba-green/5 dark:hover:border-iba-green rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-sm hover:shadow-xl text-center cursor-pointer overflow-hidden"
            >
              <div className="w-14 h-14 bg-iba-green/10 text-iba-green rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-iba-green group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-neutral-800 dark:text-neutral-100 group-hover:text-iba-green transition-colors">
                Sou Congregante
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                Cadastro rápido para participantes e frequentadores regulares dos cultos.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTipoFluxo('membro')}
              className="group relative flex flex-col items-center justify-center p-6 sm:p-8 bg-iba-cream/30 dark:bg-neutral-800/40 border-2 border-iba-sand/70 dark:border-neutral-800 hover:border-iba-green hover:bg-iba-green/5 dark:hover:border-iba-green rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-sm hover:shadow-xl text-center cursor-pointer overflow-hidden"
            >
              <div className="w-14 h-14 bg-iba-green/10 text-iba-green rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-iba-green group-hover:text-white transition-all duration-300 shadow-sm">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-neutral-800 dark:text-neutral-100 group-hover:text-iba-green transition-colors">
                Sou Membro da 2IBA
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                Ficha completa necessária para homologação do seu registro oficial de membresia.
              </p>
            </button>
          </div>
        </div>

        {renderFaqSection()}
      </div>
    );
  }

  const inputStyle = "border border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-900 dark:text-white rounded-xl px-3.5 sm:px-4 py-3 sm:py-3.5 text-sm outline-none focus:border-iba-green focus:ring-2 focus:ring-iba-green/20 transition-all duration-200 w-full placeholder:text-neutral-400";
  const inputErrorStyle = "border-red-500 focus:border-red-500 focus:ring-red-500/20";
  const labelStyle = "text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300";

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 font-sans overflow-x-hidden">
      <div className="bg-white/80 dark:bg-iba-darkCard/80 backdrop-blur-md border border-iba-sand dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 flex justify-between items-center text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-iba-sand bg-white flex items-center justify-center p-0.5 flex-none shadow-sm">
            <img src="/logo-2iba.png" alt="2IBA Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <span className="text-neutral-600 dark:text-neutral-400 text-[11px] sm:text-xs block">
              Modo selecionado: <strong className="uppercase font-bold text-iba-green">{tipoFluxo === 'membro' ? 'Membro Ativo' : 'Congregante'}</strong>
            </span>
            <span className="text-[10px] text-neutral-400">⏱️ Tempo estimado: ~3 minutos</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTipoFluxo(null)}
          className="text-red-500 hover:text-red-600 font-bold hover:underline transition-colors flex-none cursor-pointer text-xs"
        >
          Trocar Modo
        </button>
      </div>

      <form onSubmit={handleTriggerValidation} className="bg-white dark:bg-iba-darkCard border border-iba-sand dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
        
        {error && (
          <div className="mx-4 sm:mx-7 mt-5 sm:mt-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs sm:text-sm rounded-xl p-3.5 sm:p-4 flex items-center gap-3 animate-fadeIn">
            <svg className="w-5 h-5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* SEÇÃO 1: DADOS DO TITULAR */}
        <div className="p-5 sm:p-9 border-b border-iba-sand/50 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-green text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">1</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Dados Pessoais do Titular</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5 sm:gap-2 col-span-1 md:col-span-2 lg:col-span-3">
              <label className={labelStyle}>Nome completo <span className="text-red-500">*</span></label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite seu nome completo" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Gênero <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {(['Masculino', 'Feminino'] as const).map((opcao) => {
                  const ativo = genero === opcao;
                  return (
                    <button
                      type="button"
                      key={opcao}
                      onClick={() => setGenero(opcao)}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${
                        ativo 
                          ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20 shadow-sm' 
                          : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300 hover:border-iba-green/50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${ativo ? 'bg-iba-green' : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                      {opcao}
                    </button>
                  );
                })}
              </div>
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

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Estado civil <span className="text-red-500">*</span></label>
              <select required value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className={inputStyle}>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex justify-between items-center">
                <label className={labelStyle}>
                  Nome do Pai {!paiNaoConsta && <span className="text-red-500">*</span>}
                </label>
                <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={paiNaoConsta} 
                    onChange={(e) => {
                      setPaiNaoConsta(e.target.checked);
                      if (e.target.checked) setNomePai('');
                    }} 
                    className="rounded text-iba-green focus:ring-iba-green cursor-pointer" 
                  />
                  Não consta
                </label>
              </div>
              <input 
                type="text" 
                required={!paiNaoConsta} 
                disabled={paiNaoConsta} 
                value={paiNaoConsta ? '' : nomePai} 
                onChange={(e) => setNomePai(e.target.value)} 
                placeholder={paiNaoConsta ? "Não consta na certidão" : "Nome do pai"} 
                className={`${inputStyle} disabled:opacity-50`} 
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Nome da Mãe <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                required 
                value={nomeMae} 
                onChange={(e) => setNomeMae(e.target.value)} 
                placeholder="Nome da mãe" 
                className={inputStyle} 
              />
            </div>
          </div>

          {/* FICHA DO CÔNJUGE (Salva dentro de dados_familiares) */}
          {estadoCivil === 'Casado(a)' && (
            <div className="mt-6 sm:mt-8 p-4 sm:p-8 bg-iba-cream/40 dark:bg-neutral-800/30 border-l-4 border-l-iba-green border border-iba-sand dark:border-neutral-800 rounded-2xl space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-iba-green tracking-tight">Ficha Cadastral do Cônjuge (Vínculo Familiar)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 lg:col-span-3">
                  <label className={labelStyle}>Nome Completo do Cônjuge <span className="text-red-500">*</span></label>
                  <input type="text" required value={conjugeNome} onChange={(e) => setConjugeNome(e.target.value)} placeholder="Nome completo do esposo(a)" className={inputStyle} />
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>CPF do Cônjuge (Opcional)</label>
                  <input 
                    type="text" 
                    value={conjugeCpf} 
                    onChange={(e) => handleCpfChange(e, setConjugeCpf)} 
                    onBlur={(e) => validarCampoEmTempoReal('conjugeCpf', e.target.value)}
                    placeholder="000.000.000-00" 
                    className={`${inputStyle} ${errorsByField.conjugeCpf ? inputErrorStyle : ''}`} 
                  />
                  {errorsByField.conjugeCpf && <span className="text-xs text-red-500 font-semibold">{errorsByField.conjugeCpf}</span>}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>Vínculo do Cônjuge <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Membro', val: 'ADMISSÃO' },
                      { label: 'Congregante', val: 'FREQUENTADOR' }
                    ].map((opt) => {
                      const ativo = conjugeArrolamento === opt.val;
                      return (
                        <button
                          type="button"
                          key={opt.val}
                          onClick={() => setConjugeArrolamento(opt.val)}
                          className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            ativo 
                              ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                              : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className={labelStyle}>Gênero do Cônjuge <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Masculino', 'Feminino'] as const).map((opcao) => {
                      const ativo = conjugeGenero === opcao;
                      return (
                        <button
                          type="button"
                          key={opcao}
                          onClick={() => setConjugeGenero(opcao)}
                          className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            ativo 
                              ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                              : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {opcao}
                        </button>
                      );
                    })}
                  </div>
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

                <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 lg:col-span-1">
                  <div className="flex justify-between items-center">
                    <label className={labelStyle}>
                      E-mail do Cônjuge {!conjugeEmailNaoSeAplica && <span className="text-red-500">*</span>}
                    </label>
                    <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={conjugeEmailNaoSeAplica} 
                        onChange={(e) => {
                          setConjugeEmailNaoSeAplica(e.target.checked);
                          if (e.target.checked) {
                            setConjugeEmail('');
                            setErrorsByField(prev => ({ ...prev, conjugeEmail: '' }));
                          }
                        }} 
                        className="rounded text-iba-green focus:ring-iba-green cursor-pointer" 
                      />
                      Não se aplica
                    </label>
                  </div>
                  <input 
                    type="email" 
                    required={!conjugeEmailNaoSeAplica} 
                    disabled={conjugeEmailNaoSeAplica}
                    value={conjugeEmailNaoSeAplica ? '' : conjugeEmail} 
                    onChange={(e) => setConjugeEmail(e.target.value)} 
                    onBlur={(e) => !conjugeEmailNaoSeAplica && validarCampoEmTempoReal('conjugeEmail', e.target.value)}
                    placeholder={conjugeEmailNaoSeAplica ? "Não se aplica" : "conjuge@email.com"} 
                    className={`${inputStyle} disabled:opacity-50 ${errorsByField.conjugeEmail ? inputErrorStyle : ''}`} 
                  />
                  {errorsByField.conjugeEmail && <span className="text-xs text-red-500 font-semibold">{errorsByField.conjugeEmail}</span>}
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 lg:col-span-3 border-t border-iba-sand dark:border-neutral-700 pt-4 mt-2">
                  <label className={labelStyle}>O Cônjuge já foi batizado? <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    {(['Sim', 'Não'] as const).map((opcao) => {
                      const ativo = conjugeBatizado === opcao;
                      return (
                        <button
                          type="button"
                          key={opcao}
                          onClick={() => setConjugeBatizado(opcao)}
                          className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            ativo 
                              ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                              : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {opcao}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {conjugeBatizado === 'Sim' && (
                  <>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label className={labelStyle}>Tipo de Batismo <span className="text-red-500">*</span></label>
                      <select required value={conjugeTipoBatismo} onChange={(e) => setConjugeTipoBatismo(e.target.value)} className={inputStyle}>
                        <option value="Imersão">Imersão</option>
                        <option value="Aspersão">Aspersão</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label className={labelStyle}>Igreja do Batismo <span className="text-red-500">*</span></label>
                      <input type="text" required value={conjugeIgrejaBatismo} onChange={(e) => setConjugeIgrejaBatismo(e.target.value)} placeholder="Nome da igreja" className={inputStyle} />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 lg:col-span-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                        <label className={labelStyle}>
                          Data do Batismo do Cônjuge {!conjugeBatismoNaoRecordo && <span className="text-red-500">*</span>}
                        </label>
                        <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={conjugeBatismoNaoRecordo} onChange={(e) => setConjugeBatismoNaoRecordo(e.target.checked)} className="rounded text-iba-green focus:ring-iba-green" />
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

        {/* SEÇÃO 2: NÚCLEO FAMILIAR (Salvo dentro de dados_familiares) */}
        <div className="p-5 sm:p-9 border-b border-iba-sand/50 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-green text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">2</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Núcleo Familiar e Dependentes</h3>
          </div>

          <div className="flex flex-col gap-2 max-w-sm">
            <label className={labelStyle}>Possui filhos ou dependentes? <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(['Sim', 'Não'] as const).map((opcao) => {
                const ativo = possuiFilhos === opcao;
                return (
                  <button
                    type="button"
                    key={opcao}
                    onClick={() => setPossuiFilhos(opcao)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      ativo 
                        ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                        : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {opcao}
                  </button>
                );
              })}
            </div>
          </div>

          {possuiFilhos === 'Sim' && (
            <div className="space-y-4 pt-5 mt-4 border-t border-iba-sand/50 dark:border-neutral-800">
              <div className="flex justify-between items-center">
                <h5 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-500">Filhos / Dependentes Cadastrados</h5>
                <button type="button" onClick={adicionarFilho} className="bg-iba-green hover:bg-iba-greenHover text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer">
                  + Adicionar Filho
                </button>
              </div>

              {filhos.map((filho, idx) => (
                <div key={idx} className="p-4 sm:p-5 bg-iba-cream/30 dark:bg-neutral-800/20 border border-iba-sand dark:border-neutral-800 rounded-xl space-y-3.5 sm:space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-iba-sand/50 dark:border-neutral-800">
                    <span className="text-xs font-bold text-iba-green">Filho #{idx + 1}</span>
                    {filhos.length > 1 && (
                      <button type="button" onClick={() => removerFilho(idx)} className="text-xs font-bold text-red-500 hover:underline cursor-pointer">Remover</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                      <label className={labelStyle}>Nome do Filho <span className="text-red-500">*</span></label>
                      <input type="text" required value={filho.nome} onChange={(e) => atualizarFilho(idx, 'nome', e.target.value)} placeholder="Nome completo" className={inputStyle} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelStyle}>CPF do Filho (Opcional)</label>
                      <input 
                        type="text" 
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
                      <div className="grid grid-cols-2 gap-2">
                        {(['Masculino', 'Feminino'] as const).map((opcao) => {
                          const ativo = filho.genero === opcao;
                          return (
                            <button
                              type="button"
                              key={opcao}
                              onClick={() => atualizarFilho(idx, 'genero', opcao)}
                              className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                ativo 
                                  ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                                  : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              {opcao}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelStyle}>Vínculo <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Congregante', val: 'FREQUENTADOR' },
                          { label: 'Membro', val: 'ADMISSÃO' }
                        ].map((opt) => {
                          const ativo = filho.arrolamento === opt.val;
                          return (
                            <button
                              type="button"
                              key={opt.val}
                              onClick={() => atualizarFilho(idx, 'arrolamento', opt.val)}
                              className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                ativo 
                                  ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                                  : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className={labelStyle}>
                          E-mail do Filho {!filho.emailNaoSeAplica && <span className="text-red-500">*</span>}
                        </label>
                        <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={filho.emailNaoSeAplica} 
                            onChange={(e) => {
                              atualizarFilho(idx, 'emailNaoSeAplica', e.target.checked);
                              if (e.target.checked) {
                                atualizarFilho(idx, 'email', '');
                                setErrorsByField(prev => ({ ...prev, [`filhoEmail_${idx}`]: '' }));
                              }
                            }} 
                            className="rounded text-iba-green focus:ring-iba-green cursor-pointer" 
                          />
                          Não se aplica
                        </label>
                      </div>
                      <input 
                        type="email" 
                        required={!filho.emailNaoSeAplica} 
                        disabled={filho.emailNaoSeAplica}
                        value={filho.emailNaoSeAplica ? '' : filho.email} 
                        onChange={(e) => atualizarFilho(idx, 'email', e.target.value)} 
                        onBlur={(e) => !filho.emailNaoSeAplica && validarCampoEmTempoReal(`filhoEmail_${idx}`, e.target.value)}
                        placeholder={filho.emailNaoSeAplica ? "Não se aplica" : "filho@email.com"} 
                        className={`${inputStyle} disabled:opacity-50 ${errorsByField[`filhoEmail_${idx}`] ? inputErrorStyle : ''}`} 
                      />
                      {errorsByField[`filhoEmail_${idx}`] && <span className="text-xs text-red-500 font-semibold">{errorsByField[`filhoEmail_${idx}`]}</span>}
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3 border-t border-iba-sand/50 dark:border-neutral-800 pt-3 mt-1">
                      <label className={labelStyle}>O filho já foi batizado? <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-2 max-w-xs">
                        {(['Sim', 'Não'] as const).map((opcao) => {
                          const ativo = filho.foiBatizado === opcao;
                          return (
                            <button
                              type="button"
                              key={opcao}
                              onClick={() => atualizarFilho(idx, 'foiBatizado', opcao)}
                              className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                ativo 
                                  ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                                  : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                              }`}
                            >
                              {opcao}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {filho.foiBatizado === 'Sim' && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelStyle}>Tipo de Batismo <span className="text-red-500">*</span></label>
                          <select required value={filho.tipoBatismo} onChange={(e) => atualizarFilho(idx, 'tipoBatismo', e.target.value)} className={inputStyle}>
                            <option value="Imersão">Imersão</option>
                            <option value="Aspersão">Aspersão</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className={labelStyle}>Igreja do Batismo <span className="text-red-500">*</span></label>
                          <input type="text" required value={filho.igrejaBatismo} onChange={(e) => atualizarFilho(idx, 'igrejaBatismo', e.target.value)} placeholder="Nome da igreja" className={inputStyle} />
                        </div>

                        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
                          <div className="flex justify-between items-center">
                            <label className={labelStyle}>
                              Data do Batismo {!filho.batismoNaoRecordo && <span className="text-red-500">*</span>}
                            </label>
                            <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={filho.batismoNaoRecordo} onChange={(e) => atualizarFilho(idx, 'batismoNaoRecordo', e.target.checked)} className="rounded text-iba-green focus:ring-iba-green" />
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

        {/* SEÇÃO 3: HISTÓRICO DE BATISMO */}
        <div className="p-5 sm:p-9 border-b border-iba-sand/50 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-green text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">3</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Histórico de Batismo</h3>
          </div>

          <div className="flex flex-col gap-2 max-w-sm mb-5">
            <label className={labelStyle}>Você já foi batizado? <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(['Sim', 'Não'] as const).map((opcao) => {
                const ativo = titularBatizado === opcao;
                return (
                  <button
                    type="button"
                    key={opcao}
                    onClick={() => {
                      setTitularBatizado(opcao);
                      if (opcao === 'Não') {
                        setIgrejaBatismo('');
                        setDataBatismo('');
                        setBatismoNaoRecordo(false);
                        setErrorsByField(prev => ({ ...prev, dataBatismo: '' }));
                      }
                    }}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      ativo 
                        ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                        : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {opcao}
                  </button>
                );
              })}
            </div>
          </div>

          {titularBatizado === 'Sim' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fadeIn pt-2 border-t border-iba-sand/50 dark:border-neutral-800">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className={labelStyle}>Nome da Igreja do Batismo (Opcional)</label>
                <input 
                  type="text" 
                  value={igrejaBatismo} 
                  onChange={(e) => setIgrejaBatismo(e.target.value)} 
                  placeholder="Onde você foi batizado (Opcional)" 
                  className={inputStyle} 
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                  <label className={labelStyle}>
                    Data do Batismo {!batismoNaoRecordo && <span className="text-red-500">*</span>}
                  </label>
                  <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={batismoNaoRecordo} onChange={(e) => setBatismoNaoRecordo(e.target.checked)} className="rounded text-iba-green focus:ring-iba-green" />
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
          ) : titularBatizado === 'Não' ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 bg-iba-cream/30 dark:bg-neutral-800/30 p-3.5 rounded-xl border border-dashed border-iba-sand dark:border-neutral-700 animate-fadeIn">
              Que bênção! Os campos de histórico de batismo foram desconsiderados para você.
            </p>
          ) : null}
        </div>

        {/* SEÇÃO 4: DOCUMENTAÇÕES E CONTATOS */}
        <div className="p-5 sm:p-9 border-b border-iba-sand/50 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-green text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">4</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Documentações e Contatos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

            <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 lg:col-span-4">
              <div className="flex justify-between items-center">
                <label className={labelStyle}>
                  E-mail {!emailNaoSeAplica && <span className="text-red-500">*</span>}
                </label>
                <label className="text-[11px] text-neutral-500 flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailNaoSeAplica} 
                    onChange={(e) => {
                      setEmailNaoSeAplica(e.target.checked);
                      if (e.target.checked) {
                        setEmail('');
                        setErrorsByField(prev => ({ ...prev, email: '' }));
                      }
                    }} 
                    className="rounded text-iba-green focus:ring-iba-green cursor-pointer" 
                  />
                  Não se aplica
                </label>
              </div>
              <input 
                type="email" 
                required={!emailNaoSeAplica} 
                disabled={emailNaoSeAplica}
                value={emailNaoSeAplica ? '' : email} 
                onChange={(e) => setEmail(e.target.value)} 
                onBlur={(e) => !emailNaoSeAplica && validarCampoEmTempoReal('email', e.target.value)}
                placeholder={emailNaoSeAplica ? "Não se aplica" : "exemplo@email.com"} 
                className={`${inputStyle} disabled:opacity-50 ${errorsByField.email ? inputErrorStyle : ''}`} 
              />
              {errorsByField.email && <span className="text-xs text-red-500 font-semibold">{errorsByField.email}</span>}
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: ENDEREÇO RESIDENCIAL */}
        <div className="p-5 sm:p-9 border-b border-iba-sand/50 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-green text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">5</span>
            <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">Endereço Residencial</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5 sm:gap-2 relative">
              <label className={labelStyle}>CEP <span className="text-red-500">*</span></label>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  required 
                  maxLength={9} 
                  value={cep} 
                  onChange={handleCepChange} 
                  placeholder="00000-000" 
                  className={`${inputStyle} ${errorsByField.cep ? inputErrorStyle : ''}`} 
                />
                {carregandoCep && (
                  <span className="absolute right-3.5 flex items-center gap-1.5 text-xs text-iba-green font-semibold">
                    <span className="w-3.5 h-3.5 border-2 border-iba-green border-t-transparent rounded-full animate-spin" />
                  </span>
                )}
              </div>
              {errorsByField.cep && <span className="text-xs text-red-500 font-semibold">{errorsByField.cep}</span>}
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 lg:col-span-2">
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

            <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2">
              <label className={labelStyle}>Cidade <span className="text-red-500">*</span></label>
              <input type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sua cidade" className={inputStyle} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className={labelStyle}>Estado (UF) <span className="text-red-500">*</span></label>
              <input type="text" required maxLength={2} value={uf} onChange={(e) => setUf(e.target.value)} placeholder="PE" className={`${inputStyle} uppercase`} />
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 lg:col-span-3">
              <label className={labelStyle}>Ponto de Referência</label>
              <input type="text" value={pontoReferencia} onChange={(e) => setPontoReferencia(e.target.value)} placeholder="Próximo a mercado, praça..." className={inputStyle} />
            </div>
          </div>
        </div>

        {/* SEÇÃO 6: MINISTÉRIOS */}
        {tipoFluxo === 'membro' && (
          <div className="p-5 sm:p-9 border-b border-iba-sand/50 dark:border-neutral-800 bg-iba-cream/30 dark:bg-neutral-800/10 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-iba-green text-white font-bold text-xs sm:text-sm flex items-center justify-center flex-none shadow-sm">
                6
              </span>
              <div>
                <h3 className="text-neutral-900 dark:text-white text-base sm:text-lg font-bold tracking-tight">
                  Atuação Operacional e Ministérios
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Engajamento e participação nas atividades da igreja.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-sm">
              <label className={labelStyle}>
                Você faz parte de algum ministério da 2IBA atualmente? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Sim', 'Não'] as const).map((opcao) => {
                  const ativo = fazParteMinisterio === opcao;
                  return (
                    <button
                      type="button"
                      key={opcao}
                      onClick={() => {
                        setFazParteMinisterio(opcao);
                        setQualMinisterioFazParte([]);
                        setQuerParticiparMinisterio(null);
                        setQualMinisterioQuerParticipar([]);
                      }}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        ativo 
                          ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                          : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {opcao}
                    </button>
                  );
                })}
              </div>
            </div>

            {fazParteMinisterio === 'Sim' && (
              <div className="space-y-3 animate-fadeIn border-t border-iba-sand/60 dark:border-neutral-700 pt-5">
                <div className="flex justify-between items-center">
                  <label className={labelStyle}>
                    Selecione seus ministérios de atuação (um ou mais) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-iba-green bg-iba-green/10 px-2.5 py-0.5 rounded-full">
                    {qualMinisterioFazParte.length} selecionado(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                  {LISTA_MINISTERIOS.map((item) => {
                    const selecionado = qualMinisterioFazParte.includes(item.nome);
                    return (
                      <div
                        key={item.nome}
                        onClick={() => toggleMinisterio(item.nome, qualMinisterioFazParte, setQualMinisterioFazParte)}
                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
                          item.destaque ? 'sm:col-span-1' : ''
                        } ${
                          selecionado
                            ? 'border-iba-green bg-iba-green/10 dark:bg-iba-green/20 shadow-md ring-2 ring-iba-green/30'
                            : 'border-iba-sand/80 dark:border-neutral-800 bg-white dark:bg-iba-darkInput hover:border-iba-green/60 hover:shadow-sm hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            selecionado 
                              ? 'bg-iba-green text-white' 
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:text-iba-green'
                          }`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {renderIconeMinisterio(item.icone)}
                            </svg>
                          </div>

                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            selecionado 
                              ? 'border-iba-green bg-iba-green text-white' 
                              : 'border-neutral-300 dark:border-neutral-600'
                          }`}>
                            {selecionado && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        </div>

                        <div className="mt-3">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 block mb-0.5">
                            {item.tag}
                          </span>
                          <h4 className={`text-xs sm:text-sm font-bold transition-colors ${
                            selecionado ? 'text-iba-green dark:text-emerald-300' : 'text-neutral-800 dark:text-neutral-200'
                          }`}>
                            {item.nome}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {fazParteMinisterio === 'Não' && (
              <div className="space-y-4 animate-fadeIn border-t border-iba-sand/60 dark:border-neutral-700 pt-5">
                <div className="flex flex-col gap-2 max-w-sm">
                  <label className={labelStyle}>
                    Você gostaria de integrar algum ministério? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Sim', 'Não'] as const).map((opcao) => {
                      const ativo = querParticiparMinisterio === opcao;
                      return (
                        <button
                          type="button"
                          key={opcao}
                          onClick={() => {
                            setQuerParticiparMinisterio(opcao);
                            setQualMinisterioQuerParticipar([]);
                          }}
                          className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            ativo 
                              ? 'border-iba-green bg-iba-green/10 text-iba-green ring-2 ring-iba-green/20' 
                              : 'border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {opcao}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {querParticiparMinisterio === 'Sim' && (
                  <div className="space-y-3 animate-fadeIn pt-2">
                    <div className="flex justify-between items-center">
                      <label className={labelStyle}>
                        Quais ministérios você gostaria de conhecer e participar? <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-iba-green bg-iba-green/10 px-2.5 py-0.5 rounded-full">
                        {qualMinisterioQuerParticipar.length} selecionado(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                      {LISTA_MINISTERIOS.map((item) => {
                        const selecionado = qualMinisterioQuerParticipar.includes(item.nome);
                        return (
                          <div
                            key={item.nome}
                            onClick={() => toggleMinisterio(item.nome, qualMinisterioQuerParticipar, setQualMinisterioQuerParticipar)}
                            className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
                              item.destaque ? 'sm:col-span-1' : ''
                            } ${
                              selecionado
                                ? 'border-iba-green bg-iba-green/10 dark:bg-iba-green/20 shadow-md ring-2 ring-iba-green/30'
                                : 'border-iba-sand/80 dark:border-neutral-800 bg-white dark:bg-iba-darkInput hover:border-iba-green/60 hover:shadow-sm hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                selecionado 
                                  ? 'bg-iba-green text-white' 
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:text-iba-green'
                              }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {renderIconeMinisterio(item.icone)}
                                </svg>
                              </div>

                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                selecionado 
                                  ? 'border-iba-green bg-iba-green text-white' 
                                  : 'border-neutral-300 dark:border-neutral-600'
                              }`}>
                                {selecionado && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </div>

                            <div className="mt-3">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-400 block mb-0.5">
                                {item.tag}
                              </span>
                              <h4 className={`text-xs sm:text-sm font-bold transition-colors ${
                                selecionado ? 'text-iba-green dark:text-emerald-300' : 'text-neutral-800 dark:text-neutral-200'
                              }`}>
                                {item.nome}
                              </h4>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TERMO DE AUTORIZAÇÃO E CONSENTIMENTO (LGPD) */}
        <div className="p-5 sm:p-9 bg-iba-cream/40 dark:bg-neutral-800/20 border-b border-iba-sand/50 dark:border-neutral-800 space-y-4">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-iba-sand/80 dark:border-neutral-700">
            Termo de Autorização e Consentimento (LGPD - Lei nº 13.709/2018)
          </h4>
          
          <div className="max-h-[160px] overflow-y-auto text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 space-y-2.5 sm:space-y-3 pr-2 sm:pr-3 leading-relaxed bg-white dark:bg-iba-darkCard border border-iba-sand dark:border-neutral-800 p-3.5 sm:p-4 rounded-xl shadow-inner">
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
              className="mt-0.5 w-4 h-4 rounded text-iba-green focus:ring-iba-green cursor-pointer flex-none" 
            />
            <label htmlFor="aceitaTermosLgpd" className="text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 select-none cursor-pointer leading-relaxed">
              Li o termo acima e <b>autorizo expressamente</b> a 2ª Igreja Batista de Areias a tratar os meus dados pessoais e de minha família em total conformidade com a LGPD.
            </label>
          </div>
        </div>

        {/* BOTÃO FINALIZAR CADASTRO */}
        <div className="p-5 sm:p-9 bg-iba-cream/20 dark:bg-neutral-800/40 flex justify-end border-t border-iba-sand/50 dark:border-neutral-800">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-iba-green hover:bg-iba-greenHover text-white font-bold text-sm px-9 py-4 rounded-xl shadow-lg shadow-iba-green/20 transition-all duration-300 transform active:scale-95 disabled:opacity-50 cursor-pointer"
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

      {renderFaqSection()}
    </div>
  );
}