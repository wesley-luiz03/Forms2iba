'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function MemberForm({ customFields }: { customFields: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados dos campos do formulário
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [cpf, setCpf] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  
  // Endereço
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  // Condicionais de Cônjuge e Filhos
  const [nomeConjuge, setNomeConjuge] = useState('');
  const [dataUniao, setDataUniao] = useState('');
  const [haFilhos, setHaFilhos] = useState('');
  const [nomeFilho, setNomeFilho] = useState('');
  const [dataNascimentoFilho, setDataNascimentoFilho] = useState('');
  const [generoFilho, setGeneroFilho] = useState('');

  // Novos campos obrigatórios solicitados
  const [rg, setRg] = useState('');
  const [escolaridade, setEscolaridade] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('');
  const [isDoador, setIsDoador] = useState('');
  const [naturalidade, setNaturalidade] = useState('');
  const [nomePai, setNomePai] = useState('');
  const [paiNaoConsta, setPaiNaoConsta] = useState(false);
  const [nomeMae, setNomeMae] = useState('');
  const [dataBatismo, setDataBatismo] = useState('');
  const [batismoNaoRecordo, setBatismoNaoRecordo] = useState(false);

  // Máscara de CPF: XXX.XXX.XXX-XX
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(value);
  };

  // Máscara de Celular: (XX) 9XXXX-XXXX
  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    setCelular(value);
  };

  // Consulta automática de CEP via ViaCEP API
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
        })
        .catch(() => {});
    }
  }, [cep]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validação estrita de e-mail com regex de domínio
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um endereço de e-mail válido contendo @ e um domínio válido.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from('membros').insert({
      nome,
      genero,
      data_nascimento: dataNascimento,
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
      tipo_sanguineo: tipoSanguineo,
      eh_doador: isDoador,
      naturalidade,
      nome_pai: paiNaoConsta ? 'NÃO CONSTA' : nomePai,
      nome_mae: nomeMae,
      data_batismo: batismoNaoRecordo ? 'NÃO ME RECORDO' : dataBatismo,
      // Dados estruturados extras salvos como JSON payload
      dados_familiares: {
        nomeConjuge: estadoCivil === 'Casado(a)' ? nomeConjuge : null,
        dataUniao: estadoCivil === 'Casado(a)' ? dataUniao : null,
        filhos: haFilhos === 'Sim' ? { nomeFilho, dataNascimentoFilho, generoFilho } : null
      }
    });

    setLoading(false);

    if (insertError) {
      setError('Não foi possível enviar seu cadastro agora. Verifique a conexão com o banco.');
      return;
    }

    router.push('/sucesso');
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden font-sans transition-all duration-300">
      
      {error && (
        <div className="mx-7 mt-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 animate-pulse">
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
          <div className="flex flex-col gap-1.5">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Data de nascimento <span className="text-red-600">*</span></label>
            <input type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full" />
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

        {/* SUB-SEÇÃO DINÂMICA: CASADO */}
        {estadoCivil === 'Casado(a)' && (
          <div className="mt-5 p-5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-800 gap-5 grid grid-cols-1 sm:grid-cols-2 animate-fadeIn">
            <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
              <h4 className="text-sm font-bold text-iba-blue uppercase tracking-wider">Informações do Cônjuge</h4>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nome do Cônjuge</label>
              <input type="text" value={nomeConjuge} onChange={(e) => setNomeConjuge(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Data da União</label>
              <input type="date" value={dataUniao} onChange={(e) => setDataUniao(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Há Filhos?</label>
              <select value={haFilhos} onChange={(e) => setHaFilhos(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                <option value="">Selecione…</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            {/* SUB-SEÇÃO DINÂMICA FILHOS */}
            {haFilhos === 'Sim' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-1 sm:col-span-2 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 animate-fadeIn">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Nome do Filho</label>
                  <input type="text" value={nomeFilho} onChange={(e) => setNomeFilho(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Data de Nascimento</label>
                  <input type="date" value={dataNascimentoFilho} onChange={(e) => setDataNascimentoFilho(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Gênero do Filho</label>
                  <select value={generoFilho} onChange={(e) => setGeneroFilho(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-3 py-2.5 text-sm">
                    <option value="">Selecione…</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">CPF <span className="text-red-600">*</span></label>
            <input type="text" required value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">RG <span className="text-red-600">*</span></label>
            <input type="text" required value={rg} onChange={(e) => setRg(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Celular <span className="text-red-600">*</span></label>
            <input type="text" required value={celular} onChange={handleCelularChange} placeholder="(81) 99999-9999" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">E-mail <span className="text-red-600">*</span></label>
            <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@dominio.com" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue w-full" />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: ENDEREÇO (INTEGRADO À API) */}
      <div className="p-7 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="w-6 h-6 rounded-full bg-iba-dark text-iba-goldLight text-xs font-bold flex items-center justify-center flex-none">3</span>
          <h3 className="text-neutral-900 dark:text-white text-lg font-bold tracking-tight">Endereço</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">CEP <span className="text-red-600">*</span></label>
            <input type="text" required value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none" />
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

      {/* SEÇÃO 4: HISTÓRICO ECLESIASTICO E ADICIONAIS */}
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
              <option value="Pós-Graduação">Pós-Graduação</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Tipo Sanguíneo <span className="text-red-600">*</span></label>
              <select required value={tipoSanguineo} onChange={(e) => setTipoSanguineo(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                <option value="">Sel…</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Doador? <span className="text-red-600">*</span></label>
              <select required value={isDoador} onChange={(e) => setIsDoador(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm">
                <option value="">Sel…</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Naturalidade <span className="text-red-600">*</span></label>
            <input type="text" required value={naturalidade} onChange={(e) => setNaturalidade(e.target.value)} placeholder="Ex: Recife - PE" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm" />
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

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">Data do Batismo <span className="text-red-600">*</span></label>
              <label className="text-xs text-neutral-500 flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={batismoNaoRecordo} onChange={(e) => setBatismoNaoRecordo(e.target.checked)} className="rounded" /> Não me recordo</label>
            </div>
            <input type="date" required={!batismoNaoRecordo} disabled={batismoNaoRecordo} value={batismoNaoRecordo ? '' : dataBatismo} onChange={(e) => setDataBatismo(e.target.value)} className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm disabled:opacity-50" />
          </div>
        </div>
      </div>

      <div className="p-7 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
        <button type="submit" disabled={loading} className="bg-iba-blue hover:bg-iba-dark text-white font-bold text-sm px-8 py-4 rounded-lg shadow-md transition-all duration-300 transform active:scale-95 disabled:opacity-50">
          {loading ? 'Enviando Dados…' : 'Finalizar e Enviar Cadastro'}
        </button>
      </div>
    </form>
  );
}