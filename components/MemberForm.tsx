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

export default function MemberForm({ customFields }: { customFields: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- TIPO DE FLUXO PRINCIPAL ---
  const [tipoFluxo, setTipoFluxo] = useState<'membro' | 'visitante' | null>(null);
  const [errorsByField, setErrorsByField] = useState<{ [key: string]: string }>({});
  const [aceitaTermosLgpd, setAceitaTermosLgpd] = useState(false);

  // Estado para controlar os blocos do FAQ (Accordion)
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
  
  // Batismo Estendido
  const [foiBatizado, setFoiBatizado] = useState('');
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

  // Ministérios
  const [fazParteMinisterio, setFazParteMinisterio] = useState('');
  const [qualMinisterioFazParte, setQualMinisterioFazParte] = useState('');
  const [querParticiparMinisterio, setQuerParticiparMinisterio] = useState('');
  const [qualMinisterioQuerParticipar, setQualMinisterioQuerParticipar] = useState('');
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
  const [haFilhos, setHaFilhos] = useState('');

  // --- ESTADOS DOS FILHOS ---
  const [filhos, setFilhos] = useState<Filho[]>([
    { nome: '', cpf: '', dataNascimento: '', genero: '', telefone: '', email: '', foiBatizado: '', tipoBatismo: '', igrejaBatismo: '', dataBatismo: '', batismoNaoRecordo: false, arrolamento: 'FREQUENTADOR' }
  ]);

  // APIs Locais
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

  // Preenchimento automático do ViaCEP
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
          }
        }).catch(() => {});
    }
  }, [cep]);

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

  const formatarParaISO = (dataBr: string) => {
    if (!dataBr || dataBr.length !== 10) return null;
    const [dia, mes, ano] = dataBr.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  const handleBlurValidation = async (campo: string, valor: string) => {
    let erroMensagem = '';
    if (campo === 'cpf' && valor) {
      const supabase = createClient();
      const { data } = await supabase.from('membros').select('id').eq('cpf', valor).maybeSingle();
      if (data) erroMensagem = 'Este CPF já possui cadastro no sistema.';
    }
    setErrorsByField(prev => ({ ...prev, [campo]: erroMensagem }));
  };

  function handleTriggerValidation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!aceitaTermosLgpd) { setError('Você precisa aceitar os termos da LGPD.'); return; }
    if (estadoCivil === 'Casado(a)' && !conjugeNome.trim()) { setError('Preencha os dados obrigatórios do cônjuge.'); return; }
    ejecutarEnvioSupabase();
  }

  async function ejecutarEnvioSupabase() {
    setLoading(true);
    const supabase = createClient();
    const arrolamentoCalculado = tipoFluxo === 'membro' ? 'ADMISSÃO' : 'FREQUENTADOR';

    const batismoFinal = foiBatizado === 'Não' ? 'NÃO BATIZADO' : (batismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(dataBatismo));

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
        filhos: haFilhos === 'Sim' ? filhos.map(f => ({
          ...f, dataNascimento: formatarParaISO(f.dataNascimento), dataBatismo: f.batismoNaoRecordo ? 'NÃO ME RECORDO' : formatarParaISO(f.dataBatismo)
        })) : []
      },
      campos_extra: {
        ...respostasCustomizadas, orgao_expedidor: orgaoExpedidor || null, ponto_referencia: pontoReferencia || null,
        igreja_batismo: igrejaBatismo || null, tipo_batismo: tipoBatismo || null, faz_parte_ministerio: fazParteMinisterio,
        qual_ministerio_faz_parte: qualMinisterioFazParte || null, quer_participar_ministerio: querParticiparMinisterio || null,
        qual_ministerio_quer_participar: qualMinisterioQuerParticipar || null
      }
    };

    const { error: insError } = await supabase.from('membros').insert(payloadMembro);
    if (insError) { setError(insError.message); setLoading(false); return; }

    router.push('/sucesso');
  }

  if (!tipoFluxo) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 animate-fadeIn">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-1 bg-iba-gold mx-auto rounded-full" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Seja bem-vindo(a) à 2IBA!</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
            <button type="button" onClick={() => setTipoFluxo('visitante')} className="group p-6 bg-neutral-50 dark:bg-neutral-800/40 border-2 rounded-2xl text-center hover:border-emerald-500 transition-all">
              <h3 className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-500">Sou Visitante / Congregante</h3>
            </button>
            <button type="button" onClick={() => setTipoFluxo('membro')} className="group p-6 bg-neutral-50 dark:bg-neutral-800/40 border-2 rounded-2xl text-center hover:border-iba-blue transition-all">
              <h3 className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-iba-blue">Sou Membro da 2IBA</h3>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-neutral-100 dark:bg-neutral-900 border rounded-lg p-3.5 flex justify-between items-center text-xs">
        <span>Você está preenchendo como: <strong className="uppercase text-iba-blue">{tipoFluxo === 'membro' ? 'Membro' : 'Visitante / Congregante'}</strong></span>
        <button type="button" onClick={() => setTipoFluxo(null)} className="text-red-500 hover:underline font-semibold">Alterar</button>
      </div>
    
      <form onSubmit={handleTriggerValidation} className="bg-white dark:bg-neutral-900 text-black dark:text-white border rounded-xl shadow-xl overflow-hidden font-sans">
        
        {/* SEÇÃO 1: DADOS DO TITULAR */}
        <div className="p-7 border-b">
          <h3 className="text-lg font-bold mb-4">1. Dados Pessoais do Titular</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold uppercase">Nome completo *</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent outline-none w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Gênero *</label>
              <select required value={genero} onChange={(e) => setGenero(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent">
                <option value="">Selecione…</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Data de nascimento *</label>
              <input type="text" required maxLength={10} placeholder="DD/MM/AAAA" value={dataNascimento} onChange={(e) => setDataNascimento(aplicarMascaraData(e.target.value))} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold uppercase">Estado civil *</label>
              <select required value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent">
                <option value="">Selecione…</option><option value="Solteiro(a)">Solteiro(a)</option><option value="Casado(a)">Casado(a)</option><option value="Divorciado(a)">Divorciado(a)</option><option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>
          </div>

          {/* FICHA DO CÔNJUGE POSICIONADA LOGO ABAIXO DO ESTADO CIVIL "CASADO(A)" */}
          {estadoCivil === 'Casado(a)' && (
            <div className="mt-6 p-6 bg-neutral-50 dark:bg-neutral-800/20 border border-iba-blue/30 rounded-xl space-y-5 animate-fadeIn">
              <h4 className="text-base font-bold text-iba-blue flex items-center gap-2">
                💍 Ficha Cadastral do Cônjuge (Criação de Novo Cadastro Interligado)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-bold uppercase">Nome Completo do Cônjuge *</label>
                  <input type="text" required value={conjugeNome} onChange={(e) => setConjugeNome(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase">Situação Eclesiástica dela(e) *</label>
                  <select required value={conjugeArrolamento} onChange={(e) => setConjugeArrolamento(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                    <option value="">Selecione…</option>
                    <option value="ADMISSÃO">Membro</option>
                    <option value="FREQUENTADOR">Congregante</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase">Gênero do Cônjuge *</label>
                  <select required value={conjugeGenero} onChange={(e) => setConjugeGenero(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                    <option value="">Selecione…</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase">Data de Nascimento do Cônjuge *</label>
                  <input type="text" required placeholder="DD/MM/AAAA" value={conjugeNascimento} onChange={(e) => setConjugeNascimento(aplicarMascaraData(e.target.value))} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase">Celular do Cônjuge *</label>
                  <input type="text" required value={conjugeCelular} onChange={(e) => handleCelularChange(e, setConjugeCelular)} placeholder="(81) 99999-9999" className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-bold uppercase">E-mail do Cônjuge *</label>
                  <input type="email" required value={conjugeEmail} placeholder="conjuge@email.com" className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900" />
                </div>
                
                {/* Batismo do Cônjuge */}
                <div className="flex flex-col gap-1.5 col-span-2 border-t pt-4 mt-2">
                  <label className="text-xs font-bold uppercase">O Cônjuge já foi batizado? *</label>
                  <select required value={conjugeBatizado} onChange={(e) => setConjugeBatizado(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                    <option value="">Selecione…</option><option value="Sim">Sim</option><option value="Não">Não</option>
                  </select>
                </div>
                {conjugeBatizado === 'Sim' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase">Tipo de Batismo do Cônjuge *</label>
                      <select required value={conjugeTipoBatismo} onChange={(e) => setConjugeTipoBatismo(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                        <option value="">Selecione…</option><option value="Imersão">Imersão</option><option value="Aspersão">Aspersão</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase">Igreja do Batismo do Cônjuge *</label>
                      <input type="text" required value={conjugeIgrejaBatismo} onChange={(e) => setConjugeIgrejaBatismo(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900" />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase">Data do Batismo do Cônjuge</label>
                        <label className="text-xs text-neutral-500 flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={conjugeBatismoNaoRecordo} onChange={(e) => setConjugeBatismoNaoRecordo(e.target.checked)} /> Não me recordo
                        </label>
                      </div>
                      <input type="text" required={!conjugeBatismoNaoRecordo} disabled={conjugeBatismoNaoRecordo} maxLength={10} placeholder="DD/MM/AAAA" value={conjugeBatismoNaoRecordo ? '' : conjugeDataBatismo} onChange={(e) => setConjugeDataBatismo(aplicarMascaraData(e.target.value))} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-1.5 pt-4 border-t">
                <label className="text-xs font-bold uppercase">Possuem filhos? *</label>
                <select required value={haFilhos} onChange={(e) => setHaFilhos(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                  <option value="">Selecione…</option><option value="Sim">Sim</option><option value="Não">Não</option>
                </select>
              </div>

              {/* SEÇÃO COMPLETA DOS FILHOS CO-RELACIONADOS */}
              {haFilhos === 'Sim' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filhos / Dependentes</h5>
                    <button type="button" onClick={adicionarFilho} className="bg-iba-blue text-white text-xs font-bold px-3 py-1.5 rounded-md">+ Adicionar Filho</button>
                  </div>
                  {filhos.map((filho, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-neutral-900 border rounded-lg space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-[11px] font-bold">Nome do Filho *</label>
                          <input type="text" required value={filho.nome} onChange={(e) => atualizarFilho(idx, 'nome', e.target.value)} className="border rounded px-3 py-2 text-sm bg-transparent" />
                        </div>
                        {/* CPF DO FILHO OBRIGATÓRIO */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold">CPF do Filho *</label>
                          <input type="text" required value={filho.cpf} onChange={(e) => handleCpfChange(e, (v: string) => atualizarFilho(idx, 'cpf', v))} placeholder="000.000.000-00" className="border rounded px-3 py-2 text-sm bg-transparent" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold">Data de Nascimento *</label>
                          <input type="text" required placeholder="DD/MM/AAAA" value={filho.dataNascimento} onChange={(e) => atualizarFilho(idx, 'dataNascimento', aplicarMascaraData(e.target.value))} className="border rounded px-3 py-2 text-sm bg-transparent" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold">Gênero do Filho *</label>
                          <select required value={filho.genero} onChange={(e) => atualizarFilho(idx, 'genero', e.target.value)} className="border rounded px-3 py-2 text-sm bg-transparent">
                            <option value="">Selecione…</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold">Situação Eclesiástica do Filho *</label>
                          <select required value={filho.arrolamento} onChange={(e) => atualizarFilho(idx, 'arrolamento', e.target.value)} className="border rounded px-3 py-2 text-sm bg-transparent">
                            <option value="FREQUENTADOR">Congregante</option>
                            <option value="ADMISSÃO">Membro</option>
                          </select>
                        </div>

                        {/* Batismo do Filho */}
                        <div className="flex flex-col gap-1 sm:col-span-2 border-t pt-2 mt-1">
                          <label className="text-[11px] font-bold">O filho já foi batizado? *</label>
                          <select required value={filho.foiBatizado} onChange={(e) => atualizarFilho(idx, 'foiBatizado', e.target.value)} className="border rounded px-3 py-2 text-sm bg-transparent">
                            <option value="">Selecione…</option><option value="Sim">Sim</option><option value="Não">Não</option>
                          </select>
                        </div>
                        {filho.foiBatizado === 'Sim' && (
                          <>
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold">Tipo de Batismo *</label>
                              <select required value={filho.tipoBatismo} onChange={(e) => atualizarFilho(idx, 'tipoBatismo', e.target.value)} className="border rounded px-3 py-2 text-sm bg-transparent">
                                <option value="">Selecione…</option><option value="Imersão">Imersão</option><option value="Aspersão">Aspersão</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold">Igreja do Batismo *</label>
                              <input type="text" required value={filho.igrejaBatismo} onChange={(e) => atualizarFilho(idx, 'igrejaBatismo', e.target.value)} className="border rounded px-3 py-2 text-sm bg-transparent" />
                            </div>
                            <div className="flex flex-col gap-1 sm:col-span-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[11px] font-bold">Data do Batismo</label>
                                <label className="text-xs text-neutral-500 flex items-center gap-1 cursor-pointer">
                                  <input type="checkbox" checked={filho.batismoNaoRecordo} onChange={(e) => atualizarFilho(idx, 'batismoNaoRecordo', e.target.checked)} /> Não me recordo
                                </label>
                              </div>
                              <input type="text" required={!filho.batismoNaoRecordo} disabled={filho.batismoNaoRecordo} maxLength={10} placeholder="DD/MM/AAAA" value={filho.batismoNaoRecordo ? '' : filho.dataBatismo} onChange={(e) => atualizarFilho(idx, 'dataBatismo', aplicarMascaraData(e.target.value))} className="border rounded px-3 py-2 text-sm bg-transparent" />
                            </div>
                          </>
                        )}

                        {filhos.length > 1 && (
                          <div className="flex items-end justify-end sm:col-span-2 pt-2">
                            <button type="button" onClick={() => removerFilho(idx)} className="text-xs text-red-500 hover:underline">Remover Filho</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEÇÃO 2: HISTÓRICO DE BATISMO */}
        <div className="p-7 border-b">
          <h3 className="text-lg font-bold mb-4">2. Histórico de Batismo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold uppercase">Você já foi batizado? *</label>
              <select required value={foiBatizado} onChange={(e) => setFoiBatizado(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent">
                <option value="">Selecione…</option><option value="Sim">Sim</option><option value="Não">Não</option>
              </select>
            </div>
            {foiBatizado === 'Sim' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase">Tipo de Batismo *</label>
                  <select required value={tipoBatismo} onChange={(e) => setTipoBatismo(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent">
                    <option value="">Selecione…</option><option value="Imersão">Imersão</option><option value="Aspersão">Aspersão</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase">Nome da Igreja do Batismo *</label>
                  <input type="text" required value={igrejaBatismo} onChange={(e) => setIgrejaBatismo(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase">Data do Batismo</label>
                    <label className="text-xs text-neutral-500 flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={batismoNaoRecordo} onChange={(e) => setBatismoNaoRecordo(e.target.checked)} /> Não me recordo</label>
                  </div>
                  <input type="text" required={!batismoNaoRecordo} disabled={batismoNaoRecordo} maxLength={10} placeholder="DD/MM/AAAA" value={batismoNaoRecordo ? '' : dataBatismo} onChange={(e) => setDataBatismo(aplicarMascaraData(e.target.value))} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* SEÇÃO 3: DOCUMENTAÇÕES E CONTATOS */}
        <div className="p-7 border-b">
          <h3 className="text-lg font-bold mb-4">3. Documentações e Contatos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">CPF</label>
              <input type="text" value={cpf} onChange={(e) => handleCpfChange(e, setCpf)} placeholder="000.000.000-00" className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase">RG (Opcional)</label>
                <input type="text" value={rg} onChange={(e) => setRg(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase">Órgão Expedidor</label>
                <input type="text" placeholder="Ex: SDS/PE" value={orgaoExpedidor} onChange={(e) => setOrgaoExpedidor(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Celular *</label>
              <input type="text" required value={celular} onChange={(e) => handleCelularChange(e, setCellular)} placeholder="(81) 99999-9999" className="border rounded-lg px-4 py-3 text-sm bg-transparent outline-none w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">E-mail *</label>
              <input type="email" required value={email} placeholder="exemplo@email.com" className="border rounded-lg px-4 py-3 text-sm bg-transparent w-full" />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: ENDEREÇO RESIDENCIAL (RESTAURADOS BAIRRO, CIDADE E ESTADO) */}
        <div className="p-7 border-b">
          <h3 className="text-lg font-bold mb-4">4. Endereço Residencial</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">CEP *</label>
              <input type="text" required maxLength={9} value={cep} onChange={(e) => setCep(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase">Logradouro / Rua *</label>
              <input type="text" required value={endereco} onChange={(e) => setEndereco(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Número *</label>
              <input type="text" required value={numero} onChange={(e) => setNumero(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Complemento</label>
              <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Bairro *</label>
              <input type="text" required value={bairro} onChange={(e) => setBairro(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase">Cidade *</label>
              <input type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Estado (UF) *</label>
              <input type="text" required maxLength={2} value={uf} onChange={(e) => setUf(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent uppercase" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <label className="text-xs font-bold uppercase">Ponto de Referência</label>
              <input type="text" value={pontoReferencia} onChange={(e) => setPontoReferencia(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-transparent" />
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: MINISTÉRIOS COM PERGUNTA CONDICIONAL EM "NÃO" */}
        {tipoFluxo === 'membro' && (
          <div className="p-7 border-b bg-neutral-50/50 dark:bg-neutral-800/10 space-y-5">
            <h3 className="text-lg font-bold mb-4">5. Atuação Operacional e Ministérios</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase">Você faz parte de algum ministério da 2IBA? *</label>
              <select required value={fazParteMinisterio} onChange={(e) => setFazParteMinisterio(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                <option value="">Selecione…</option><option value="Sim">Sim</option><option value="Não">Não</option>
              </select>
            </div>

            {fazParteMinisterio === 'Sim' && (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-xs font-bold uppercase">Qual ministério você faz parte? *</label>
                <select required value={qualMinisterioFazParte} onChange={(e) => setQualMinisterioFazParte(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                  <option value="">Selecione o ministério…</option>
                  {MINISTERIOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            {fazParteMinisterio === 'Não' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase">Você deseja fazer parte de algum ministério? *</label>
                  <select required value={querParticiparMinisterio} onChange={(e) => setQuerParticiparMinisterio(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                    <option value="">Selecione…</option><option value="Sim">Sim</option><option value="Não">Não</option>
                  </select>
                </div>

                {querParticiparMinisterio === 'Sim' && (
                  <div className="flex flex-col gap-1.5 animate-fadeIn">
                    <label className="text-xs font-bold uppercase">Qual ministério você gostaria de integrar? *</label>
                    <select required value={qualMinisterioQuerParticipar} onChange={(e) => setQualMinisterioQuerParticipar(e.target.value)} className="border rounded-lg px-4 py-3 text-sm bg-white dark:bg-neutral-900">
                      <option value="">Selecione o ministério de interesse…</option>
                      {MINISTERIOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TERMO DE CONSENTIMENTO */}
        <div className="p-7 bg-neutral-50 dark:bg-neutral-800/10 space-y-4">
          <div className="flex items-start gap-3">
            <input type="checkbox" id="aceitaTermosLgpd" checked={aceitaTermosLgpd} onChange={(e) => setAceitaTermosLgpd(e.target.checked)} className="mt-1 w-4 h-4 cursor-pointer" />
            <label htmlFor="aceitaTermosLgpd" className="text-xs text-neutral-600 dark:text-neutral-400 select-none cursor-pointer">Autorizo o processamento seguro dos dados da minha família sob as conformidades estritas da LGPD.</label>
          </div>
        </div>

        <div className="p-7 bg-neutral-50 dark:bg-neutral-800/40 flex justify-end">
          <button type="submit" disabled={loading} className="bg-iba-blue text-white font-bold text-sm px-8 py-4 rounded-lg shadow-md transition-all transform active:scale-95">
            {loading ? 'Processando Família...' : 'Finalizar Cadastro Familiar'}
          </button>
        </div>
      </form>

      {/* DÚVIDAS FREQUENTES (ESTRUTURA EM BLOCOS / ACCORDION DINÂMICO) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-md space-y-4 transition-all duration-300">
        <h4 className="text-base font-bold text-neutral-900 dark:text-white pb-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
          ❓ Perguntas e Dúvidas Frequentes
        </h4>
        <div className="space-y-3">
          {FAQS.map((faq) => {
            const isAberto = faqAberto === faq.id;
            return (
              <div key={faq.id} className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden transition-colors bg-neutral-50/50 dark:bg-neutral-800/20">
                <button
                  type="button"
                  onClick={() => setFaqAberto(isAberto ? null : faq.id)}
                  className="w-full text-left p-4 flex justify-between items-center gap-4 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">{faq.pergunta}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-iba-blue/10 text-iba-blue rounded-md flex-none">
                    {isAberto ? 'Recolher -' : 'Ver Resposta +'}
                  </span>
                </button>
                {isAberto && (
                  <div className="p-4 pt-0 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/50 animate-fadeIn">
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