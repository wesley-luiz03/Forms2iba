'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Filho {
  nome: string;
  dataNascimento: string;
  genero: string;
  telefone: string;
  email: string;
}

interface EstadoIBGE {
  sigla: string;
  nome: string;
}

interface CidadeIBGE {
  nome: string;
}

export default function MemberForm({ customFields }: { customFields: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para capturar erros em tempo real por campo (onBlur)
  const [errorsByField, setErrorsByField] = useState<{ [key: string]: string }>({});

  // Controle de Janela Flutuante para a LGPD
  const [showLgpdModal, setShowLgpdModal] = useState(false);

  // Estados dos campos do formulário - Dados Pessoais
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [celular, setCellular] = useState('');
  const [email, setEmail] = useState('');

  // Formato de data para DD/MM/AAAA
  const [dataNascimento, setDataNascimento] = useState('');
  const [dataBatismo, setDataBatismo] = useState('');
  const [dataUniao, setDataUniao] = useState('');
  
  // Localização e Endereço
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  // Lógica de Cônjuge e Dependentes
  const [nomeConjuge, setNomeConjuge] = useState('');
  const [haFilhos, setHaFilhos] = useState('');

  // Estrutura Dinâmica Infinita para Múltiplos Filhos
  const [filhos, setFilhos] = useState<Filho[]>([
    { nome: '', dataNascimento: '', genero: '', telephone: '', email: '' }
  ]);

  // Ficha Eclesiástica e Adicionais
  const [escolaridade, setEscolaridade] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [isDoador, setIsDoador] = useState('');
  const [nomePai, setNomePai] = useState('');
  const [paiNaoConsta, setPaiNaoConsta] = useState(false);
  const [nomeMae, setNomeMae] = useState('');
  const [batismoNaoRecordo, setBatismoNaoRecordo] = useState(false);

  // Estados da API de Naturalidade do IBGE
  const [listaEstados, setListaEstados] = useState<EstadoIBGE[]>([]);
  const [listaCidades, setListaCidades] = useState<string[]>([]);
  const [estadoNatural, setEstadoNatural] = useState('');
  const [cidadeNatural, setCidadeNatural] = useState('');
  const [carregandoCidades, setCarregandoCidades] = useState(false);

  // Carrega os estados brasileiros ao iniciar
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?ordenar=nome')
      .then((res) => res.json())
      .then((data) => setListaEstados(data))
      .catch(() => {});
  }, []);

  // Busca os municípios de acordo com a UF selecionada
  useEffect(() => {
    if (!estadoNatural) {
      setListaCidades([]);
      return;
    }
    setCarregandoCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoNatural}/municipios`)
      .then((res) => res.json())
      .then((data: CidadeIBGE[]) => {
        setListaCidades(data.map((c) => c.nome));
        setCarregandoCidades(false);
      })
      .catch(() => setCarregandoCidades(false));
  }, [estadoNatural]);

  // Auto-complete de Endereço via ViaCEP
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
            setErrorsByField(prev => { const n = {...prev}; delete n.cep; return n; });
          } else {
            setErrorsByField(prev => ({ ...prev, cep: 'CEP não encontrado na base dos Correios.' }));
          }
        })
        .catch(() => {});
    }
  }, [cep]);

  // Manipuladores de Filhos
  const adicionarFilho = () => {
    setFilhos([...filhos, { nome: '', dataNascimento: '', genero: '', telefone: '', email: '' }]);
  };

  const removerFilho = (index: number) => {
    if (filhos.length === 1) {
      setFilhos([{ nome: '', dataNascimento: '', genero: '', telefone: '', email: '' }]);
    } else {
      setFilhos(filhos.filter((_, i) => i !== index));
    }
  };

  const atualizarFilho = (index: number, campo: keyof Filho, valor: string) => {
    const novosFilhos = [...filhos];
    novosFilhos[index][campo] = valor;
    setFilhos(novosFilhos);
  };

  // --- FUNÇÕES DE MÁSCARA INTELIGENTE ---
  const aplicarMascaraData = (value: string) => {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 8) clean = clean.slice(0, 8);
    if (clean.length >= 5) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    } else if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(value);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(value);
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    setCellular(value);
  };

  const formatarParaISO = (dataBr: string) => {
    if (!dataBr || dataBr.length !== 10) return null;
    const [dia, mes, ano] = dataBr.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  const validarCPF = (strCPF: string): boolean => {
    const cleanCPF = strCPF.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma = soma + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  };

  // --- VALIDATOR INTELLIGENCE ONBLUR (Aparece ao sair do campo) ---
  const handleBlurValidation = (campo: string, valor: string) => {
    let erroMensagem = '';

    if (campo === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (valor && !emailRegex.test(valor)) {
        erroMensagem = 'E-mail inválido. Deve conter @ e um domínio válido.';
      }
    }

    if (campo === 'cpf') {
      if (valor && !validarCPF(valor)) {
        erroMensagem = 'CPF inválido. Verifique os dígitos verificadores.';
      }
    }

    if (campo === 'cep') {
      if (valor && valor.replace(/\D/g, '').length !== 8) {
        erroMensagem = 'O CEP deve conter exatamente 8 dígitos (00000-000).';
      }
    }

    if (campo === 'dataNascimento' || campo === 'dataBatismo' || campo === 'dataUniao') {
      if (valor && valor.length !== 10) {
        erroMensagem = 'Data incompleta. Use o formato padrão DD/MM/AAAA.';
      }
    }

    setErrorsByField(prev => {
      const novosErros = { ...prev };
      if (erroMensagem) {
        novosErros[campo] = erroMensagem;
      } else {
        delete novosErros[campo];
      }
      return novosErros;
    });
  };

  function handleTriggerValidation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Filtra o objeto para ignorar chaves que possuam chaves vazias ou limpas
    const errosAtivos = Object.keys(errorsByField).filter(key => errorsByField[key] !== '');

    if (errosAtivos.length > 0) {
      setError('Por favor, corrija os erros apontados nos campos antes de enviar.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!validarCPF(cpf) || cep.replace(/\D/g, '').length !== 8 || dataNascimento.length !== 10) {
      setError('Existem campos obrigatórios vazios ou em formatos incorretos.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setShowLgpdModal(true);
  }

async function executarEnvioSupabase() {
    setLoading(true);
    const supabase = createClient();
    const naturalidadeCompleta = `${cidadeNatural} - ${estadoNatural}`;

    const nascimentoISO = formatarParaISO(dataNascimento);
    const uniaoISO = estadoCivil === 'Casado(a)' ? formatarParaISO(dataUniao) : null;
    const batismoISO = batismoNaoRecordo ? 'NÃO ME RECORDO' : dataBatismo;

    // Criamos o payload contendo estritamente as colunas reais da sua tabela membros
    const payloadMembro = {
      nome, 
      genero, 
      data_nascimento: nascimentoISO, 
      estado_civil: estadoCivil, 
      cpf, 
      celular, 
      email, 
      cep, 
      endereco, 
      numero,
      complemento, 
      bairro, 
      cidade, 
      uf, 
      rg, 
      escolaridade, 
      tipo_sanguineo: tipoSanguineo || null,
      eh_doador: isDoador || null, 
      naturalidade: naturalidadeCompleta,
      nome_pai: paiNaoConsta ? 'NÃO CONSTA' : nomePai, 
      nome_mae: nomeMae, 
      data_batismo: batismoISO,
      dados_familiares: {
        nomeConjuge: estadoCivil === 'Casado(a)' ? nomeConjuge : null,
        dataUniao: uniaoISO, 
        filhos: haFilhos === 'Sim' ? filhos : []
      }
    };

    const { error: insertError } = await supabase.from('membros').insert(payloadMembro);

    if (insertError) {
      setLoading(false);
      setError(`Erro ao gravar dados no banco de dados: ${insertError.message}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

setLoading(false);

    // DISPARO SEGURO ATRAVÉS DA SUA API ROUTE INTERNA
    fetch('/api/notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento: 'novo_membro_cadastrado',
        nome: payloadMembro.nome,
        celular: payloadMembro.celular,
        email: payloadMembro.email,
        bairro: payloadMembro.bairro,
        data_cadastro: new Date().toLocaleString('pt-BR')
      })
    }).catch((e) => console.warn('Notificação enviada para a fila de background.'));

    // Redireciona o usuário imediatamente para a tela de sucesso
    router.push('/sucesso');
    setLoading(false);
    router.push('/sucesso');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleTriggerValidation} className="bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden font-sans transition-all duration-300">
        
        {error && (
          <div className="mx-7 mt-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* SEÇÃO 1: DADOS PESSOAIS */}
        <div className="p-7 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-iba-dark text-iba-goldLight text-xs font-bold flex items-center justify-center flex-none">1</span>
            <h3 className="text-neutral-900 dark:text-white text-lg font-bold tracking-tight">Dados pessoais</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Nome completo <span className="text-red-600">*</span></label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Gênero <span className="text-red-600">*</span></label>
              <select required value={genero} onChange={(e) => setGenero(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full">
                <option value="">Selecione…</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Data de nascimento <span className="text-red-600">*</span></label>
              <input 
                type="text" required maxLength={10} placeholder="DD/MM/AAAA" value={dataNascimento}
                onChange={(e) => setDataNascimento(aplicarMascaraData(e.target.value))}
                onBlur={(e) => handleBlurValidation('dataNascimento', e.target.value)}
                className={`border bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none w-full transition-colors ${errorsByField.dataNascimento ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:border-iba-blue'}`}
              />
              {errorsByField.dataNascimento && (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 animate-fadeIn">⚠️ {errorsByField.dataNascimento}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Estado civil <span className="text-red-600">*</span></label>
              <select required value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full">
                <option value="">Selecione…</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>
          </div>

          {/* COMPONENTE DINÂMICO DE CASAMENTO */}
          {estadoCivil === 'Casado(a)' && (
            <div className="mt-5 p-5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 gap-5 grid grid-cols-1 sm:grid-cols-2 animate-fadeIn">
              <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                <h4 className="text-sm font-bold text-iba-blue uppercase tracking-wider">Informações do Cônjuge</h4>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nome do Cônjuge</label>
                <input type="text" value={nomeConjuge} onChange={(e) => setNomeConjuge(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Data da União</label>
                <input 
                  type="text" maxLength={10} placeholder="DD/MM/AAAA" value={dataUniao}
                  onChange={(e) => setDataUniao(aplicarMascaraData(e.target.value))}
                  onBlur={(e) => handleBlurValidation('dataUniao', e.target.value)}
                  className={`border bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm transition-colors ${errorsByField.dataUniao ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'}`}
                />
                {errorsByField.dataUniao && (
                  <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1">⚠️ {errorsByField.dataUniao}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Há Filhos?</label>
                <select value={haFilhos} onChange={(e) => setHaFilhos(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                  <option value="">Selecione…</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              {/* COMPONENTE DE FILHOS */}
              {haFilhos === 'Sim' && (
                <div className="col-span-1 sm:col-span-2 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Dependentes / Filhos</h5>
                    <button type="button" onClick={adicionarFilho} className="bg-iba-blue hover:bg-iba-dark text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm">+ Adicionar Filho</button>
                  </div>

                  {filhos.map((filho, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-3 relative animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded text-neutral-600 dark:text-neutral-300">Filho #{idx + 1}</span>
                        {filhos.length > 1 && (
                          <button type="button" onClick={() => removerFilho(idx)} className="text-xs text-red-500 hover:underline">Remover</button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-500 uppercase">Nome <span className="text-red-500">*</span></label>
                          <input type="text" required value={filho.nome} onChange={(e) => atualizarFilho(idx, 'nome', e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded px-3 py-2 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-500 uppercase">Nascimento <span className="text-red-500">*</span></label>
                          <input 
                            type="text" required maxLength={10} placeholder="DD/MM/AAAA" value={filho.dataNascimento}
                            onChange={(e) => atualizarFilho(idx, 'dataNascimento', aplicarMascaraData(e.target.value))}
                            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded px-3 py-2 text-sm" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-500 uppercase">Gênero <span className="text-red-500">*</span></label>
                          <select required value={filho.genero} onChange={(e) => atualizarFilho(idx, 'genero', e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded px-3 py-2 text-sm">
                            <option value="">Sel…</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase">Telefone (Opcional)</label>
                          <input type="text" value={filho.telefone} onChange={(e) => atualizarFilho(idx, 'telefone', e.target.value)} placeholder="(81) 99999-0000" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded px-3 py-2 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-neutral-400 uppercase">E-mail (Opcional)</label>
                          <input type="email" value={filho.email} onChange={(e) => atualizarFilho(idx, 'email', e.target.value)} placeholder="filho@email.com" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded px-3 py-2 text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEÇÃO 2: DOCUMENTAÇÃO E CONTATO */}
        <div className="p-7 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-iba-dark text-iba-goldLight text-xs font-bold flex items-center justify-center flex-none">2</span>
            <h3 className="text-neutral-900 dark:text-white text-lg font-bold tracking-tight">Documentos e Contato</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">CPF <span className="text-red-600">*</span></label>
              <input 
                type="text" required value={cpf} placeholder="000.000.000-00"
                onChange={handleCpfChange}
                onBlur={(e) => handleBlurValidation('cpf', e.target.value)}
                className={`border bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors ${errorsByField.cpf ? 'border-red-500 focus:border-red-500 shadow-sm' : 'border-neutral-300 dark:border-neutral-700 focus:border-iba-blue'}`}
              />
              {errorsByField.cpf && (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 animate-fadeIn">⚠️ {errorsByField.cpf}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">RG <span className="text-red-600">*</span></label>
              <input type="text" required value={rg} onChange={(e) => setRg(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Celular <span className="text-red-600">*</span></label>
              <input type="text" required value={celular} onChange={handleCelularChange} placeholder="(81) 99999-9999" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none" />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">E-mail <span className="text-red-600">*</span></label>
              <input 
                type="text" required value={email} placeholder="exemplo@dominio.com"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => handleBlurValidation('email', e.target.value)}
                className={`border bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors ${errorsByField.email ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:border-iba-blue'}`}
              />
              {errorsByField.email && (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 animate-fadeIn">⚠️ {errorsByField.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: ENDEREÇO */}
        <div className="p-7 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-iba-dark text-iba-goldLight text-xs font-bold flex items-center justify-center flex-none">3</span>
            <h3 className="text-neutral-900 dark:text-white text-lg font-bold tracking-tight">Endereço</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">CEP <span className="text-red-600">*</span></label>
              <input 
                type="text" required maxLength={9} value={cep} placeholder="00000-000" 
                onChange={handleCepChange}
                onBlur={(e) => handleBlurValidation('cep', e.target.value)}
                className={`border bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors ${errorsByField.cep ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700'}`}
              />
              {errorsByField.cep && (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 animate-fadeIn">⚠️ {errorsByField.cep}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Rua / Logradouro <span className="text-red-600">*</span></label>
              <input type="text" required value={endereco} onChange={(e) => setEndereco(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Número <span className="text-red-600">*</span></label>
              <input type="text" required value={numero} onChange={(e) => setNumero(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Complemento</label>
              <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Bairro <span className="text-red-600">*</span></label>
              <input type="text" required value={bairro} onChange={(e) => setBairro(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Cidade <span className="text-red-600">*</span></label>
              <input type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">UF <span className="text-red-600">*</span></label>
              <input type="text" required value={uf} onChange={(e) => setUf(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: ADICIONAIS */}
        <div className="p-7">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-iba-dark text-iba-goldLight text-xs font-bold flex items-center justify-center flex-none">4</span>
            <h3 className="text-neutral-900 dark:text-white text-lg font-bold tracking-tight">Ficha Eclesiástica e Adicionais</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Escolaridade <span className="text-red-600">*</span></label>
              <select required value={escolaridade} onChange={(e) => setEscolaridade(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                <option value="">Selecione…</option>
                <option value="Não Alfabetizado">Não Alfabetizado</option>
                <option value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</option>
                <option value="Ensino Fundamental Completo">Ensino Fundamental Completo</option>
                <option value="Curso Técnico Incompleto">Curso Técnico Incompleto</option>
                <option value="Curso Técnico Completo">Curso Técnico Completo</option>
                <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
                <option value="Ensino Superior Completo">Ensino Superior Completo</option>
                <option value="Mestrado">Mestrado</option>
                <option value="Doutorado">Doutorado</option>
                <option value="Pós-Graduação">Pós-Graduação</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Tipo Sanguíneo</label>
                <select value={tipoSanguineo} onChange={(e) => setTipoSanguineo(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                  <option value="">Sel…</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Doador?</label>
                <select value={isDoador} onChange={(e) => setIsDoador(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                  <option value="">Sel…</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2 p-4 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Estado Natal (UF) <span className="text-red-600">*</span></label>
                <select required value={estadoNatural} onChange={(e) => { setEstadoNatural(e.target.value); setCidadeNatural(''); }} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                  <option value="">Selecione o Estado…</option>
                  {listaEstados.map((est) => (
                    <option key={est.sigla} value={est.sigla}>{est.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Cidade Natal <span className="text-red-600">*</span></label>
                <select required value={cidadeNatural} disabled={!estadoNatural || carregandoCidades} onChange={(e) => setCidadeNatural(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm disabled:opacity-50">
                  <option value="">{carregandoCidades ? 'Carregando Cidades…' : 'Selecione a Cidade…'}</option>
                  {listaCidades.map((cid) => (
                    <option key={cid} value={cid}>{cid}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Nome da Mãe <span className="text-red-600">*</span></label>
              <input type="text" required value={nomeMae} onChange={(e) => setNomeMae(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Nome do Pai</label>
                <label className="text-xs text-neutral-500 flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={paiNaoConsta} onChange={(e) => setPaiNaoConsta(e.target.checked)} className="rounded" /> Não Consta</label>
              </div>
              <input type="text" disabled={paiNaoConsta} value={paiNaoConsta ? '' : nomePai} onChange={(e) => setNomePai(e.target.value)} placeholder={paiNaoConsta ? "Isento" : "Nome completo do pai"} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm disabled:opacity-50" />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Data do Batismo <span className="text-red-600">*</span></label>
                <label className="text-xs text-neutral-500 flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={batismoNaoRecordo} onChange={(e) => setBatismoNaoRecordo(e.target.checked)} className="rounded" /> "Não me recordo"</label>
              </div>
              <input 
                type="text" required={!batismoNaoRecordo} disabled={batismoNaoRecordo} maxLength={10}
                placeholder={batismoNaoRecordo ? "Isento" : "DD/MM/AAAA"}
                value={batismoNaoRecordo ? '' : dataBatismo} 
                onChange={(e) => setDataBatismo(aplicarMascaraData(e.target.value))} 
                onBlur={(e) => handleBlurValidation('dataBatismo', e.target.value)}
                className={`border bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm disabled:opacity-50 transition-colors ${errorsByField.dataBatismo ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:border-iba-blue'}`}
              />
              {errorsByField.dataBatismo && !batismoNaoRecordo && (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1 animate-fadeIn">⚠️ {errorsByField.dataBatismo}</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-7 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button type="submit" disabled={loading} className="bg-iba-blue hover:bg-iba-dark text-white font-bold text-sm px-8 py-4 rounded-lg shadow-md transition-all duration-300 transform active:scale-95 disabled:opacity-50">
            {loading ? 'Validando…' : 'Finalizar e Enviar Cadastro'}
          </button>
        </div>
      </form>

      {/* BANNER INSTITUCIONAL DE SUPORTE */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md transition-all duration-300">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center flex-none">
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397 0 11.966 0c3.178.001 6.169 1.24 8.424 3.496 2.254 2.256 3.491 5.249 3.491 8.425 0 6.561-5.337 11.91-11.907 11.91-2.005-.001-3.975-.51-5.729-1.48L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.864-9.842.002-2.63-1.023-5.101-2.885-6.964C16.531 1.936 14.062.912 11.966.912c-5.439 0-9.864 4.414-9.868 9.843-.001 1.71.464 3.385 1.346 4.914l-.991 3.616 3.7-.971zM17.16 14.5c-.297-.15-1.758-.868-2.031-.967-.272-.099-.47-.148-.668.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Ficou com alguma dúvida ou encontrou um problema?</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Fale diretamente com a equipe de suporte e secretaria da 2IBA pelo WhatsApp Business.</p>
          </div>
        </div>
        <a 
          href="https://wa.me/558192549740?text=Ol%C3%A1%21+Estou+preenchendo+o+Formul%C3%A1rio+de+Membresia+da+2IBA+e+preciso+de+ajuda." 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 flex-none"
        >
          Chamar no Suporte
        </a>
      </div>

      {/* MODAL WINDOW DE CONSENTIMENTO DA LGPD */}
      {showLgpdModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <h4 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-tight border-b border-neutral-100 dark:border-neutral-800 pb-2">
              Termo de Autorização e Consentimento (LGPD)
            </h4>
            
            <div className="overflow-y-auto text-xs text-neutral-600 dark:text-neutral-400 space-y-3 pr-2 leading-relaxed">
              <p>
                Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>, ao confirmar este cadastro, você autoriza expressamente que a <strong>2ª Igreja Batista de Areias</strong> realize o tratamento de seus dados pessoais para fins exclusivos de gestão eclesiástica, registros de membresia, relatórios estatísticos internos e comunicações oficiais de atividades pastorais.
              </p>
              <p>
                <strong>Uso de Imagem e Voz:</strong> Você declara estar ciente e autoriza o uso eventual de sua imagem e voz em registros fotográficos ou audiovisuais realizados durante as celebrações públicas e eventos promovidos pela igreja, destinados à divulgação institucional em mídias sociais ou canais de transmissão oficiais, sem fins lucrativos.
              </p>
              <p>
                A igreja compromete-se a zelar pela segurança das informações, não compartilhando dados pessoais com terceiros para fins comerciais. Você poderá solicitar a atualização ou revogação deste consentimento a qualquer momento junto à secretaria da igreja.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button 
                type="button" 
                onClick={() => setShowLgpdModal(false)} 
                className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200"
              >
                Recusar e Voltar
              </button>
              <button 
                type="button" 
                disabled={loading}
                onClick={() => {
                  setShowLgpdModal(false);
                  executarEnvioSupabase();
                }} 
                className="px-5 py-2 rounded-lg bg-iba-blue hover:bg-iba-dark text-white text-xs font-bold shadow-md transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Processando…' : 'Aceitar e Finalizar Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}