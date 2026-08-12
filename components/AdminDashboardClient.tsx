'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { formatarMembrosParaExcel, Membro } from '@/lib/eklesiaColumns';

export default function AdminDashboardClient({ membrosIniciais }: { membrosIniciais?: Membro[] }) {
  const [membros, setMembros] = useState<Membro[]>(membrosIniciais || []);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [atualizando, setAtualizando] = useState(false);
  const [temNovosCadastros, setTemNovosCadastros] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estado do Pop-up / Toast
  const [toastNotificacao, setToastNotificacao] = useState<string | null>(null);

  // Estados de Seleção para Exclusão
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [membroParaExcluirUnico, setMembroParaExcluirUnico] = useState<Membro | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // TIMEOUT DE OCIOSIDADE (10 MINUTOS)
  const tempoInatividadeRef = useRef<NodeJS.Timeout | null>(null);

  // CARREGAMENTO INICIAL DOS DADOS NO NAVEGADOR
  useEffect(() => {
    setMounted(true);
    
    const carregarMembrosIniciais = async () => {
      setCarregando(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('membros')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMembros(data);
      }
      setCarregando(false);
    };

    carregarMembrosIniciais();

    // Timer de inatividade (10 min)
    const TEMPO_OCIOSIDADE_MS = 3 * 60 * 1000;
    const deslogarPorInatividade = () => {
      document.cookie = "dev_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      window.location.href = '/admin/login';
    };

    const resetarTimer = () => {
      if (tempoInatividadeRef.current) clearTimeout(tempoInatividadeRef.current);
      tempoInatividadeRef.current = setTimeout(deslogarPorInatividade, TEMPO_OCIOSIDADE_MS);
    };

    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    eventos.forEach((evt) => window.addEventListener(evt, resetarTimer));

    resetarTimer();

    return () => {
      if (tempoInatividadeRef.current) clearTimeout(tempoInatividadeRef.current);
      eventos.forEach((evt) => window.removeEventListener(evt, resetarTimer));
    };
  }, []);

  // MONITORAMENTO AUTOMÁTICO DE NOVOS CADASTROS (15s)
  useEffect(() => {
    const checarNovosCadastros = async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null && count > membros.length) {
        setTemNovosCadastros(true);
      }
    };

    const interval = setInterval(checarNovosCadastros, 15000);
    return () => clearInterval(interval);
  }, [membros.length]);

  // FUNÇÃO MANUAL DE REFRESH DOS DADOS
  const recarregarDados = async () => {
    setAtualizando(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMembros(data);
      setTemNovosCadastros(false);
      setToastNotificacao(`Sistema atualizado! Total de ${data.length} usuário(s) cadastrado(s).`);
    } else if (error) {
      setToastNotificacao('Erro ao sincronizar com o banco de dados.');
    }
    
    setTimeout(() => setAtualizando(false), 500);
    setTimeout(() => setToastNotificacao(null), 4000);
  };

  // Filtragem Dinâmica
  const membrosFiltrados = membros.filter((m) => {
    const atendeBusca = 
      m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      m.cpf?.includes(busca) ||
      m.email?.toLowerCase().includes(busca.toLowerCase());

    if (filtroTipo === 'membro') return atendeBusca && m.arrolamento === 'ADMISSÃO';
    if (filtroTipo === 'visitante') return atendeBusca && m.arrolamento === 'FREQUENTADOR';
    return atendeBusca;
  });

  // Lógica de Seleção Múltipla
  const toggleSelecionarTodos = () => {
    if (selecionados.length === membrosFiltrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(membrosFiltrados.map((m) => m.id));
    }
  };

  const toggleSelecionarUm = (id: string) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter((item) => item !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  // EXCLUSÃO REAL NO SUPABASE
  const confirmarExclusao = async () => {
    setExcluindo(true);
    const supabase = createClient();

    const idsParaDeletar = membroParaExcluirUnico 
      ? [membroParaExcluirUnico.id] 
      : selecionados;

    const { error } = await supabase
      .from('membros')
      .delete()
      .in('id', idsParaDeletar);

    if (error) {
      alert(`Erro ao excluir registro(s): ${error.message}`);
    } else {
      const novosMembros = membros.filter((m) => !idsParaDeletar.includes(m.id));
      setMembros(novosMembros);
      setSelecionados([]);
      setMembroParaExcluirUnico(null);
      setModalExclusaoAberto(false);
      setToastNotificacao(`Registro(s) excluído(s). Total atual: ${novosMembros.length} usuário(s).`);
      setTimeout(() => setToastNotificacao(null), 4000);
    }
    setExcluindo(false);
  };

// Exportador XLSX
  const exportarExcel = () => {
    const dadosParaExportar = membrosFiltrados.length > 0 ? membrosFiltrados : membros;
    
    if (dadosParaExportar.length === 0) {
      alert('Nenhum cadastro encontrado para exportar.');
      return;
    }

    const dadosFormatados = formatarMembrosParaExcel(dadosParaExportar);
    
    // Converte os dados formatados em planilha
    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Membros 2IBA');
    
    // Auto-ajuste de largura de colunas
    if (dadosFormatados.length > 0) {
      const colWidths = Object.keys(dadosFormatados[0]).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...dadosFormatados.map((r) => String((r as any)[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
      });
      worksheet['!cols'] = colWidths;
    }

    const dataHoje = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `2IBA_Relatorio_Membros_${dataHoje}.xlsx`);
  };

  // Exportador Backup SQL
  const exportarSQL = () => {
    const lista = membrosFiltrados.length > 0 ? membrosFiltrados : membros;
    if (lista.length === 0) {
      alert('Nenhum cadastro encontrado para gerar o arquivo SQL.');
      return;
    }

    let sqlContent = `-- BACKUP BANCO DE DADOS 2IBA - GENERATED AT ${new Date().toLocaleString('pt-BR')}\n\n`;

    lista.forEach((m) => {
      const escapeStr = (val: any) => (val !== null && val !== undefined && val !== '') ? `'${String(val).replace(/'/g, "''")}'` : 'NULL';
      
      sqlContent += `INSERT INTO public.membros (id, nome, genero, data_nascimento, estado_civil, cpf, rg, celular, email, cep, endereco, numero, complemento, bairro, cidade, uf, nome_pai, nome_mae, data_batismo, arrolamento, dados_familiares, campos_extra, created_at) VALUES (\n`;
      sqlContent += `  ${escapeStr(m.id)},\n`;
      sqlContent += `  ${escapeStr(m.nome)},\n`;
      sqlContent += `  ${escapeStr(m.genero)},\n`;
      sqlContent += `  ${escapeStr(m.data_nascimento)},\n`;
      sqlContent += `  ${escapeStr(m.estado_civil)},\n`;
      sqlContent += `  ${escapeStr(m.cpf)},\n`;
      sqlContent += `  ${escapeStr(m.rg)},\n`;
      sqlContent += `  ${escapeStr(m.celular)},\n`;
      sqlContent += `  ${escapeStr(m.email)},\n`;
      sqlContent += `  ${escapeStr(m.cep)},\n`;
      sqlContent += `  ${escapeStr(m.endereco)},\n`;
      sqlContent += `  ${escapeStr(m.numero)},\n`;
      sqlContent += `  ${escapeStr(m.complemento)},\n`;
      sqlContent += `  ${escapeStr(m.bairro)},\n`;
      sqlContent += `  ${escapeStr(m.cidade)},\n`;
      sqlContent += `  ${escapeStr(m.uf)},\n`;
      sqlContent += `  ${escapeStr(m.nome_pai)},\n`;
      sqlContent += `  ${escapeStr(m.nome_mae)},\n`;
      sqlContent += `  ${escapeStr(m.data_batismo)},\n`;
      sqlContent += `  ${escapeStr(m.arrolamento)},\n`;
      sqlContent += `  '${JSON.stringify(m.dados_familiares || {})}'::jsonb,\n`;
      sqlContent += `  '${JSON.stringify(m.campos_extra || {})}'::jsonb,\n`;
      sqlContent += `  ${escapeStr(m.created_at)}\n`;
      sqlContent += `) ON CONFLICT (id) DO NOTHING;\n\n`;
    });

    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dataHoje = new Date().toISOString().split('T')[0];
    link.download = `2IBA_Backup_Membros_${dataHoje}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full">
      {/* CARD DE AÇÕES E EXPORTAÇÃO */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              Painel do Desenvolvedor — 2IBA
            </h2>
            
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={recarregarDados}
                disabled={atualizando || carregando}
                className={`p-2.5 rounded-xl transition-all active:scale-90 cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  temNovosCadastros
                    ? 'bg-amber-500 text-white animate-bounce shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20'
                    : 'text-neutral-500 hover:text-iba-blue bg-neutral-100 dark:bg-neutral-800 hover:bg-iba-blue/10 dark:hover:bg-iba-blue/20'
                }`}
                title={temNovosCadastros ? "Novo cadastro detectado! Clique para atualizar." : "Atualizar lista de cadastros"}
              >
                <svg 
                  className={`w-4 h-4 ${atualizando || carregando ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {temNovosCadastros && <span>Novo!</span>}
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Total de {membros.length} cadastros no banco. Sessão expira em 3 minutos de inatividade.
          </p>
        </div>

        {/* BOTÕES DE DOWNLOAD */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          {selecionados.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMembroParaExcluirUnico(null);
                setModalExclusaoAberto(true);
              }}
              className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Excluir ({selecionados.length})
            </button>
          )}

          <button
            type="button"
            onClick={exportarSQL}
            className="whitespace-nowrap bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4 text-iba-gold flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <span>Exportar SQL</span>
          </button>

          <button
            type="button"
            onClick={exportarExcel}
            className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exportar XLSX</span>
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        <div className="md:col-span-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail..."
            className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-iba-blue"
          />
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-iba-blue"
        >
          <option value="todos">Todos os Registros ({membros.length})</option>
          <option value="membro">Apenas Membros Ativos</option>
          <option value="visitante">Apenas Visitantes / Congregantes</option>
        </select>
      </div>

      {/* TABELA DE REGISTROS */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-md overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 uppercase tracking-wider font-bold text-neutral-600 dark:text-neutral-400">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={membrosFiltrados.length > 0 && selecionados.length === membrosFiltrados.length}
                    onChange={toggleSelecionarTodos}
                    className="rounded text-iba-blue cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Nome</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">CPF</th>
                <th className="py-3.5 px-4">Celular</th>
                <th className="py-3.5 px-4">Cidade / UF</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
              {carregando ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-iba-blue border-t-transparent rounded-full animate-spin" />
                      <span>Buscando cadastros no banco de dados...</span>
                    </div>
                  </td>
                </tr>
              ) : membrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-400">
                    Nenhum registro encontrado no banco de dados.
                  </td>
                </tr>
              ) : (
                membrosFiltrados.map((m) => {
                  const estaSelecionado = selecionados.includes(m.id);
                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors ${
                        estaSelecionado ? 'bg-iba-blue/5 dark:bg-iba-blue/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={estaSelecionado}
                          onChange={() => toggleSelecionarUm(m.id)}
                          className="rounded text-iba-blue cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">{m.nome}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          m.arrolamento === 'ADMISSÃO' 
                            ? 'bg-iba-blue/10 text-iba-blue' 
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {m.arrolamento === 'ADMISSÃO' ? 'Membro' : 'Visitante'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{m.cpf || '—'}</td>
                      <td className="py-3.5 px-4">{m.celular || '—'}</td>
                      <td className="py-3.5 px-4">{m.cidade ? `${m.cidade} / ${m.uf}` : '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setMembroParaExcluirUnico(m);
                            setModalExclusaoAberto(true);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors font-bold cursor-pointer"
                          title="Excluir do Banco de Dados"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalExclusaoAberto && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fadeIn pointer-events-auto">
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Confirmar Exclusão Definitiva?
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {membroParaExcluirUnico ? (
                  <>Você está prestes a remover o registro de <strong className="text-neutral-900 dark:text-white">{membroParaExcluirUnico.nome}</strong> diretamente do banco de dados.</>
                ) : (
                  <>Você está prestes a remover <strong className="text-red-500">{selecionados.length} registro(s)</strong> selecionado(s) diretamente do banco de dados.</>
                )}
                <br />Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => {
                  setModalExclusaoAberto(false);
                  setMembroParaExcluirUnico(null);
                }}
                className="w-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={confirmarExclusao}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP NO CANTO INFERIOR ESQUERDO */}
      {mounted && toastNotificacao && createPortal(
        <div className="fixed bottom-6 left-6 z-[999999] animate-fadeIn transition-all pointer-events-auto">
          <div className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-5 py-3.5 rounded-2xl shadow-2xl border border-neutral-700 dark:border-neutral-200 flex items-center justify-between gap-4 text-xs font-semibold max-w-sm sm:max-w-md">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-none" />
              <span className="leading-snug">{toastNotificacao}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotificacao(null)}
              className="text-neutral-400 hover:text-white dark:hover:text-black text-xs font-bold cursor-pointer p-1 rounded-lg transition-colors flex-none"
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}