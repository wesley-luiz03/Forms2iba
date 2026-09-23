'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { formatarMembrosParaExcel, Membro } from '@/lib/eklesiaColumns';
import { gerarRelatorioPdfLideranca } from '@/lib/relatorioPdf';

interface GrupoDuplicado {
  chave: string;
  nomeExibicao: string;
  principal: Membro;
  duplicatas: Membro[];
}

export default function AdminDashboardClient({ membrosIniciais }: { membrosIniciais?: Membro[] }) {
  const [membros, setMembros] = useState<Membro[]>(membrosIniciais || []);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [atualizando, setAtualizando] = useState(false);
  const [temNovosCadastros, setTemNovosCadastros] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Perfil de Acesso: 'admin' (acesso total) | 'viewer' (apenas dashboards)
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('admin');

  // Controle de Abas: 'metricas' | 'todos' | 'duplicados'
  const [abaAtiva, setAbaAtiva] = useState<'metricas' | 'todos' | 'duplicados'>('metricas');

  // Estado do Toast
  const [toastNotificacao, setToastNotificacao] = useState<string | null>(null);

  // Estados de Seleção e Exclusão
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [membroParaExcluirUnico, setMembroParaExcluirUnico] = useState<Membro | null>(null);
  const [excluindoEmLoteDuplicados, setExcluindoEmLoteDuplicados] = useState(false);
  const [confirmouBackup, setConfirmouBackup] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const tempoInatividadeRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);

    const savedRole = localStorage.getItem('user_role');
    if (savedRole === 'viewer') {
      setUserRole('viewer');
      setAbaAtiva('metricas');
    } else {
      setUserRole('admin');
    }

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

    const TEMPO_OCIOSIDADE_MS = 10 * 60 * 1000;
    const deslogarPorInatividade = () => {
      localStorage.removeItem('dev_authenticated');
      localStorage.removeItem('user_role');
      document.cookie = "dev_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
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

  // Monitoramento a cada 15s
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
      setToastNotificacao(`Sincronizado! Total de ${data.length} cadastro(s).`);
    } else if (error) {
      setToastNotificacao('Erro ao sincronizar com o banco de dados.');
    }

    setTimeout(() => setAtualizando(false), 500);
    setTimeout(() => setToastNotificacao(null), 4000);
  };

  const calcularCompletude = (item: Membro): number => {
    let pontos = 0;
    if (item.cpf && item.cpf !== '—' && item.cpf.trim() !== '') pontos += 5;
    if (item.celular && item.celular !== '—' && item.celular.trim() !== '') pontos += 4;
    if (item.email && item.email !== '—' && item.email.trim() !== '' && item.email !== 'NÃO SE APLICA') pontos += 3;
    if (item.cep && item.cep.trim() !== '') pontos += 2;
    if (item.endereco && item.endereco.trim() !== '') pontos += 2;
    if (item.rg && item.rg.trim() !== '') pontos += 1;
    if (item.data_nascimento) pontos += 1;
    if (item.data_batismo && item.data_batismo !== 'NÃO ME RECORDO') pontos += 1;
    return pontos;
  };

  // IDENTIFICAÇÃO E AGRUPAMENTO DE DUPLICADOS (NOME NORMALIZADO)
  const gruposDuplicados = useMemo(() => {
    const normalizar = (texto?: string) =>
      (texto || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const mapa = new Map<string, Membro[]>();

    membros.forEach((m) => {
      const nomeLimpo = normalizar(m.nome);
      if (!nomeLimpo) return;

      const chave = `nome_${nomeLimpo}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, []);
      }
      mapa.get(chave)!.push(m);
    });

    const grupos: GrupoDuplicado[] = [];

    mapa.forEach((listaMembros, chave) => {
      if (listaMembros.length > 1) {
        const ordenados = [...listaMembros].sort((a, b) => {
          const diffPontos = calcularCompletude(b) - calcularCompletude(a);
          if (diffPontos !== 0) return diffPontos;
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
        });

        grupos.push({
          chave,
          nomeExibicao: ordenados[0].nome || 'Sem nome',
          principal: ordenados[0],
          duplicatas: ordenados.slice(1)
        });
      }
    });

    return grupos;
  }, [membros]);

  const todosIdsDuplicadosParaRemover = useMemo(() => {
    return gruposDuplicados.flatMap((g) => g.duplicatas.map((d) => d.id));
  }, [gruposDuplicados]);

  // CADASTROS ÚNICOS HIGIENIZADOS
  const membrosUnicos = useMemo(() => {
    const idsDuplicatas = new Set(todosIdsDuplicadosParaRemover);
    return membros.filter((m) => !idsDuplicatas.has(m.id));
  }, [membros, todosIdsDuplicadosParaRemover]);

  // CÁLCULO DAS MÉTRICAS REAIS, TEMPORAIS E ESTATÍSTICAS
  const metricas = useMemo(() => {
    const total = membrosUnicos.length;
    let membrosAtivos = 0;
    let congregantes = 0;
    let homens = 0;
    let mulheres = 0;

    let criancas = 0; // 0 a 11 anos
    let jovens = 0;    // 12 a 29 anos
    let adultos = 0;   // 30 a 59 anos
    let idosos = 0;    // 60+ anos

    const mapaCidades: { [key: string]: number } = {};
    const mapaMinisterios: { [key: string]: number } = {};

    // Normalizador Canônico de Ministérios
    const canonicosMinisterios: Record<string, string> = {
      'ministerio administrativo': 'Ministério Administrativo',
      'ministerio da 3a idade': 'Ministério da 3ª idade',
      'ministerio da familia': 'Ministério da Família',
      'ministerio da juventude': 'Ministério da Juventude',
      'ministerio de acao social': 'Ministério de Ação Social',
      'ministerio de artes graficas': 'Ministério de Artes Gráficas',
      'ministerio de comunicacao': 'Ministério de Comunicação',
      'ministerio de educacao religiosa': 'Ministério de Educação Religiosa',
      'ministerio de evangelismo e missoes': 'Ministério de Evangelismo e Missões',
      'ministerio de intercessao': 'Ministério de Intercessão',
      'ministerio de louvor': 'Ministério de Louvor',
      'ministerio diaconal': 'Ministério Diaconal',
      'ministerio infantil': 'Ministério Infantil',
      'ministerio maos de deus': 'Ministério Mãos de Deus',
    };

    // Parâmetros Temporais
    const agora = new Date();
    const anoAtual = agora.getFullYear();

    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    let cadastrosHoje = 0;
    let cadastrosSemana = 0;
    let cadastrosMes = 0;

    // Estrutura dos últimos 7 dias para o gráfico temporal
    const mapaDiasSemana: { [chaveData: string]: { label: string; qtd: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(agora.getTime() - i * 24 * 60 * 60 * 1000);
      const chave = d.toISOString().split('T')[0];
      const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const diaMes = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      mapaDiasSemana[chave] = { label: `${diaSemana}, ${diaMes}`, qtd: 0 };
    }

    membrosUnicos.forEach((m) => {
      // 1. Tipo de Vínculo
      if (m.arrolamento === 'ADMISSÃO') membrosAtivos++;
      else congregantes++;

      // 2. Gênero
      if (m.genero === 'Feminino') mulheres++;
      else homens++;

      // 3. Faixa Etária
      if (m.data_nascimento) {
        const anoNasc = parseInt(m.data_nascimento.substring(0, 4), 10);
        if (!isNaN(anoNasc)) {
          const idade = anoAtual - anoNasc;
          if (idade <= 11) criancas++;
          else if (idade <= 29) jovens++;
          else if (idade <= 59) adultos++;
          else idosos++;
        }
      }

      // 4. Cidade
      const cidadeRaw = (m.cidade || '').trim();
      if (cidadeRaw) {
        const cidadeFormatada = cidadeRaw.charAt(0).toUpperCase() + cidadeRaw.slice(1).toLowerCase();
        mapaCidades[cidadeFormatada] = (mapaCidades[cidadeFormatada] || 0) + 1;
      }

      // 5. Ministérios com unificação canônica
      const listaM = m.campos_extra?.qual_ministerio_faz_parte;
      if (Array.isArray(listaM)) {
        listaM.forEach((minNome: string) => {
          if (typeof minNome === 'string' && minNome.trim()) {
            const chave = minNome
              .trim()
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');

            const nomeOficial = canonicosMinisterios[chave] || minNome.trim();
            mapaMinisterios[nomeOficial] = (mapaMinisterios[nomeOficial] || 0) + 1;
          }
        });
      }

      // 6. Análise de Recadastramentos Temporais
      if (m.created_at) {
        const dataCad = new Date(m.created_at);
        if (dataCad >= inicioHoje) cadastrosHoje++;
        if (dataCad >= seteDiasAtras) cadastrosSemana++;
        if (dataCad >= inicioMes) cadastrosMes++;

        const chaveDia = dataCad.toISOString().split('T')[0];
        if (mapaDiasSemana[chaveDia]) {
          mapaDiasSemana[chaveDia].qtd++;
        }
      }
    });

    const rankingCidades = Object.entries(mapaCidades)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 6);

    const rankingMinisterios = Object.entries(mapaMinisterios)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

    const evolucaoUltimos7Dias = Object.entries(mapaDiasSemana).map(([chave, val]) => ({
      dataChave: chave,
      label: val.label,
      qtd: val.qtd
    }));

    return {
      total,
      membrosAtivos,
      congregantes,
      homens,
      mulheres,
      temporais: {
        hoje: cadastrosHoje,
        semana: cadastrosSemana,
        mes: cadastrosMes,
        evolucaoUltimos7Dias
      },
      faixasEtarias: [
        { label: 'Crianças (0-11)', qtd: criancas, cor: 'bg-amber-500' },
        { label: 'Jovens (12-29)', qtd: jovens, cor: 'bg-emerald-500' },
        { label: 'Adultos (30-59)', qtd: adultos, cor: 'bg-blue-500' },
        { label: '60+ Anos', qtd: idosos, cor: 'bg-purple-500' },
      ],
      rankingCidades,
      rankingMinisterios
    };
  }, [membrosUnicos]);

  const pct = (val: number, total: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

  // Filtragem Dinâmica da Tabela Geral
  const membrosFiltrados = membros.filter((m) => {
    const atendeBusca =
      m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      m.cpf?.includes(busca) ||
      m.email?.toLowerCase().includes(busca.toLowerCase());

    if (filtroTipo === 'membro') return atendeBusca && m.arrolamento === 'ADMISSÃO';
    if (filtroTipo === 'congregante') return atendeBusca && m.arrolamento === 'FREQUENTADOR';
    return atendeBusca;
  });

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

  const confirmarExclusao = async () => {
    if (userRole === 'viewer') return;

    setExcluindo(true);
    const supabase = createClient();

    let idsParaDeletar: string[] = [];

    if (excluindoEmLoteDuplicados) {
      idsParaDeletar = todosIdsDuplicadosParaRemover;
    } else if (membroParaExcluirUnico) {
      idsParaDeletar = [membroParaExcluirUnico.id];
    } else {
      idsParaDeletar = selecionados;
    }

    const { error } = await supabase.from('membros').delete().in('id', idsParaDeletar);

    if (error) {
      alert(`Erro ao excluir registro(s): ${error.message}`);
    } else {
      const novosMembros = membros.filter((m) => !idsParaDeletar.includes(m.id));
      setMembros(novosMembros);
      setSelecionados([]);
      setMembroParaExcluirUnico(null);
      setExcluindoEmLoteDuplicados(false);
      setConfirmouBackup(false);
      setModalExclusaoAberto(false);
      setToastNotificacao(`Operação concluída! ${idsParaDeletar.length} registro(s) removido(s) do banco de dados.`);
      setTimeout(() => setToastNotificacao(null), 4000);
    }
    setExcluindo(false);
  };

  const exportarExcel = () => {
    const dadosParaExportar = membrosFiltrados.length > 0 ? membrosFiltrados : membros;
    if (dadosParaExportar.length === 0) {
      alert('Nenhum cadastro encontrado para exportar.');
      return;
    }

    const idsDuplicadosSet = new Set(todosIdsDuplicadosParaRemover);
    const listaLimpa = dadosParaExportar.filter((m) => !idsDuplicadosSet.has(m.id));
    const dadosFormatados = formatarMembrosParaExcel(listaLimpa);

    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Membros 2IBA');

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

  const exportarSQL = () => {
    const lista = membros;
    if (lista.length === 0) {
      alert('Nenhum cadastro encontrado para gerar o arquivo SQL.');
      return;
    }

    let sqlContent = `-- BACKUP BANCO DE DADOS 2IBA - GERADO EM ${new Date().toLocaleString('pt-BR')}\n\n`;

    lista.forEach((m) => {
      const escapeStr = (val: any) =>
        val !== null && val !== undefined && val !== '' ? `'${String(val).replace(/'/g, "''")}'` : 'NULL';

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
    link.download = `2IBA_Backup_Seguranca_Pre_Limpeza_${dataHoje}.sql`;
    link.click();
    URL.revokeObjectURL(url);

    setConfirmouBackup(true);
    setToastNotificacao('Backup SQL baixado com sucesso! Agora você pode prosseguir.');
    setTimeout(() => setToastNotificacao(null), 4000);
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full">
      {/* CSS PARA IMPRESSÃO EM FOLHA A4 / PDF */}
      <style jsx global>{`
        @media print {
          nav,
          button,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* CARD SUPERIOR COM TOTAL E STATUS */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full no-print">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              {userRole === 'viewer' ? 'Painel da Liderança — 2IBA' : 'Painel do Desenvolvedor — 2IBA'}
            </h2>

            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={recarregarDados}
                disabled={atualizando || carregando}
                className={`p-2 rounded-xl transition-all active:scale-90 cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  temNovosCadastros
                    ? 'bg-amber-500 text-white animate-bounce shadow-lg shadow-amber-500/30'
                    : 'text-neutral-500 hover:text-iba-green bg-neutral-100 dark:bg-neutral-800'
                }`}
                title={temNovosCadastros ? 'Novo cadastro detectado! Clique para atualizar.' : 'Atualizar dados'}
              >
                <svg
                  className={`w-4 h-4 ${atualizando || carregando ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {temNovosCadastros && <span>Novo!</span>}
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Total de <strong>{membros.length}</strong> registros no banco (<strong>{membrosUnicos.length}</strong> pessoas únicas).
            {userRole === 'viewer' && ' Acesso exclusivo para visualização de relatórios.'}
          </p>
        </div>

        {/* BOTÕES DE EXPORTAÇÃO (APENAS PARA O ADMINISTRADOR) */}
        {userRole === 'admin' && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            {selecionados.length > 0 && abaAtiva === 'todos' && (
              <button
                type="button"
                onClick={() => {
                  setMembroParaExcluirUnico(null);
                  setExcluindoEmLoteDuplicados(false);
                  setModalExclusaoAberto(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Excluir ({selecionados.length})
              </button>
            )}

            <button
              type="button"
              onClick={exportarSQL}
              className="bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-iba-gold flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
              <span>Exportar SQL</span>
            </button>

            <button
              type="button"
              onClick={exportarExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Exportar XLSX</span>
            </button>
          </div>
        )}
      </div>

      {/* SELETOR DE ABAS */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-4 overflow-x-auto no-print">
        <button
          type="button"
          onClick={() => setAbaAtiva('metricas')}
          className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
            abaAtiva === 'metricas'
              ? 'border-iba-green text-iba-green dark:text-emerald-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span>Métricas & Liderança</span>
        </button>

        {userRole === 'admin' && (
          <>
            <button
              type="button"
              onClick={() => setAbaAtiva('todos')}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                abaAtiva === 'todos'
                  ? 'border-iba-green text-iba-green dark:text-emerald-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span>Todos os Cadastros ({membros.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('duplicados')}
              className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                abaAtiva === 'duplicados'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span>Auditoria de Duplicados</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  gruposDuplicados.length > 0
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                }`}
              >
                {gruposDuplicados.length} caso(s)
              </span>
            </button>
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* ABA 1: DASHBOARDS E MÉTRICAS PARA LIDERANÇA                   */}
      {/* ============================================================== */}
      {abaAtiva === 'metricas' && (
        <div className="space-y-6 animate-fadeIn font-sans print-container">
          
          {/* CABEÇALHO DO RELATÓRIO COM BOTÕES DE PDF E IMPRESSÃO */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Relatório Executivo de Membresia</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Consolidado
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Dados atualizados em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 no-print w-full sm:w-auto">
              <button
                type="button"
                onClick={() => gerarRelatorioPdfLideranca(metricas)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
                title="Gera e faz download do arquivo PDF formatado da 2IBA"
              >
                <svg className="w-4 h-4 text-white flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportar Relatório PDF Oficial</span>
              </button>

              <button
                type="button"
                onClick={imprimirRelatorio}
                className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center"
                title="Abre o painel de impressão rápida do navegador"
              >
                <svg className="w-4 h-4 text-neutral-300 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Imprimir Rápido</span>
              </button>
            </div>
          </div>

          {/* NOVO DASHBOARD TEMPORAL: RITMO DE RECADASTRAMENTO */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ritmo e Frequência de Recadastramento
                </h4>
                <p className="text-xs text-neutral-400">
                  Acompanhamento cronológico das submissões concluídas no sistema.
                </p>
              </div>
              <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                {metricas.temporais.semana} cadastros nos últimos 7 dias
              </span>
            </div>

            {/* CARTÕES TEMPORAIS (HOJE, SEMANA, MÊS) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
                <span className="text-[11px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block tracking-wider">
                  Cadastros Hoje
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {metricas.temporais.hoje}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-semibold">
                    desde as 00:00
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-sky-200/80 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20 space-y-1">
                <span className="text-[11px] uppercase font-bold text-sky-700 dark:text-sky-400 block tracking-wider">
                  Esta Semana
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-sky-700 dark:text-sky-300">
                    {metricas.temporais.semana}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-semibold">
                    últimos 7 dias
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-1">
                <span className="text-[11px] uppercase font-bold text-purple-700 dark:text-purple-400 block tracking-wider">
                  Este Mês
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-purple-700 dark:text-purple-300">
                    {metricas.temporais.mes}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-semibold">
                    acumulado do mês
                  </span>
                </div>
              </div>
            </div>

            {/* GRÁFICO DE BARRAS DOS ÚLTIMOS 7 DIAS */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                Evolução Diária (Últimos 7 Dias)
              </span>

              <div className="grid grid-cols-7 gap-2 sm:gap-4 h-36 items-end px-2 pt-6 border-b border-neutral-200 dark:border-neutral-800">
                {metricas.temporais.evolucaoUltimos7Dias.map((item) => {
                  const maxQtd = Math.max(...metricas.temporais.evolucaoUltimos7Dias.map(d => d.qtd), 1);
                  const alturaPct = Math.max(Math.round((item.qtd / maxQtd) * 100), 10);
                  const isPico = item.qtd === maxQtd && item.qtd > 0;

                  return (
                    <div key={item.dataChave} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[11px] sm:text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                        {item.qtd}
                      </span>
                      <div className="w-full max-w-[42px] bg-neutral-100 dark:bg-neutral-800 rounded-t-lg overflow-hidden h-full flex items-end">
                        <div
                          style={{ height: `${alturaPct}%` }}
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            isPico ? 'bg-iba-green shadow-md shadow-iba-green/30' : 'bg-emerald-400/80 dark:bg-emerald-600/80 group-hover:bg-iba-green'
                          }`}
                          title={`${item.label}: ${item.qtd} cadastros`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legendas dos dias da semana */}
              <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center text-[10px] sm:text-[11px] font-bold text-neutral-500">
                {metricas.temporais.evolucaoUltimos7Dias.map((item) => (
                  <span key={item.dataChave} className="truncate" title={item.label}>
                    {item.label.split(',')[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CARDS DE TOTALIZADORES PRINCIPAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Cadastros Ativos
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                  {metricas.total}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Pessoas Únicas
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Total líquido sem duplicidades</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Membros Ativos
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-iba-green">
                  {metricas.membrosAtivos}
                </span>
                <span className="text-xs font-bold text-iba-green bg-iba-green/10 px-2 py-0.5 rounded-full">
                  {pct(metricas.membrosAtivos, metricas.total)}%
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Rol formal da igreja</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Congregantes
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {metricas.congregantes}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {pct(metricas.congregantes, metricas.total)}%
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Frequentadores regulares</p>
            </div>
          </div>

          {/* GRÁFICOS EM PIZZA / DONUT (VÍNCULO E GÊNERO) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRÁFICO PIZZA 1: MEMBROS VS CONGREGANTES */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-iba-green" />
                  Distribuição: Membros vs. Congregantes
                </h4>
                <span className="text-xs text-neutral-400 font-semibold">{metricas.total} total</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                {/* SVG DONUT CHART */}
                <div className="relative w-40 h-40 flex items-center justify-center flex-none">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="3.8"
                      className="text-neutral-100 dark:text-neutral-800"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#55804B"
                      strokeWidth="3.8"
                      strokeDasharray={`${pct(metricas.membrosAtivos, metricas.total)} ${100 - pct(metricas.membrosAtivos, metricas.total)}`}
                      strokeDashoffset="0"
                      className="transition-all duration-700 ease-out"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="3.8"
                      strokeDasharray={`${pct(metricas.congregantes, metricas.total)} ${100 - pct(metricas.congregantes, metricas.total)}`}
                      strokeDashoffset={`-${pct(metricas.membrosAtivos, metricas.total)}`}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-extrabold text-neutral-900 dark:text-white block leading-none">
                      {metricas.total}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Pessoas</span>
                  </div>
                </div>

                {/* Legendas */}
                <div className="space-y-3 w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-4 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-iba-green flex-none" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Membros Ativos</span>
                    </div>
                    <span className="text-xs font-extrabold text-iba-green">
                      {metricas.membrosAtivos} ({pct(metricas.membrosAtivos, metricas.total)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 flex-none" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Congregantes</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600">
                      {metricas.congregantes} ({pct(metricas.congregantes, metricas.total)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* GRÁFICO PIZZA 2: DISTRIBUIÇÃO POR GÊNERO */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Distribuição por Gênero
                </h4>
                <span className="text-xs text-neutral-400 font-semibold">{metricas.total} total</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                {/* SVG DONUT CHART */}
                <div className="relative w-40 h-40 flex items-center justify-center flex-none">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="3.8"
                      className="text-neutral-100 dark:text-neutral-800"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#f43f5e"
                      strokeWidth="3.8"
                      strokeDasharray={`${pct(metricas.mulheres, metricas.total)} ${100 - pct(metricas.mulheres, metricas.total)}`}
                      strokeDashoffset="0"
                      className="transition-all duration-700 ease-out"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke="#0284c7"
                      strokeWidth="3.8"
                      strokeDasharray={`${pct(metricas.homens, metricas.total)} ${100 - pct(metricas.homens, metricas.total)}`}
                      strokeDashoffset={`-${pct(metricas.mulheres, metricas.total)}`}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-extrabold text-neutral-900 dark:text-white block leading-none">
                      {metricas.total}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total</span>
                  </div>
                </div>

                {/* Legendas */}
                <div className="space-y-3 w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-4 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 flex-none" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Mulheres</span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-500">
                      {metricas.mulheres} ({pct(metricas.mulheres, metricas.total)}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-sky-600 flex-none" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Homens</span>
                    </div>
                    <span className="text-xs font-extrabold text-sky-600">
                      {metricas.homens} ({pct(metricas.homens, metricas.total)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICO EM TORRES VERTICAIS: FAIXA ETÁRIA */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Distribuição por Faixa Etária (Gráfico de Torres)
              </h4>
              <span className="text-xs text-neutral-400 font-semibold">Cálculo pela data de nascimento</span>
            </div>

            {/* EIXO DE TORRES VERTICAIS */}
            <div className="grid grid-cols-4 gap-3 sm:gap-6 h-52 items-end pt-8 px-2 border-b border-neutral-200 dark:border-neutral-800">
              {metricas.faixasEtarias.map((faixa) => {
                const alturaMax = Math.max(...metricas.faixasEtarias.map((f) => f.qtd), 1);
                const alturaPct = Math.max(Math.round((faixa.qtd / alturaMax) * 100), 12);

                return (
                  <div key={faixa.label} className="flex flex-col items-center h-full justify-end group">
                    <div className="text-center mb-2">
                      <span className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white block">
                        {faixa.qtd}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold">
                        {pct(faixa.qtd, metricas.total)}%
                      </span>
                    </div>

                    <div className="w-full max-w-[60px] bg-neutral-100 dark:bg-neutral-800 rounded-t-xl overflow-hidden h-full flex items-end">
                      <div
                        style={{ height: `${alturaPct}%` }}
                        className={`w-full ${faixa.cor} rounded-t-xl transition-all duration-700 group-hover:brightness-110 shadow-md`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legenda inferior das Torres */}
            <div className="grid grid-cols-4 gap-3 sm:gap-6 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400">
              {metricas.faixasEtarias.map((faixa) => (
                <span key={faixa.label} className="text-[11px] sm:text-xs truncate" title={faixa.label}>
                  {faixa.label}
                </span>
              ))}
            </div>
          </div>

          {/* DISTRIBUIÇÃO POR MINISTÉRIO E CIDADE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DISTRIBUIÇÃO POR MINISTÉRIO */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-iba-green" />
                  Membros por Ministério Atual
                </h4>
                <span className="text-xs text-neutral-400 font-semibold">{metricas.rankingMinisterios.length} ministérios</span>
              </div>

              {metricas.rankingMinisterios.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">Nenhum membro vinculado a ministérios ainda.</p>
              ) : (
                <div className="space-y-3 pt-1 max-h-[320px] overflow-y-auto pr-2">
                  {metricas.rankingMinisterios.map((min, idx) => {
                    const maiorQtd = metricas.rankingMinisterios[0]?.qtd || 1;
                    const barraPct = Math.round((min.qtd / maiorQtd) * 100);

                    return (
                      <div key={min.nome} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-neutral-800 dark:text-neutral-200 truncate pr-2">
                            {idx + 1}. {min.nome}
                          </span>
                          <span className="text-iba-green font-bold flex-none">{min.qtd} pessoas</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${barraPct}%` }}
                            className="h-full bg-iba-green rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DISTRIBUIÇÃO POR CIDADE */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Distribuição Geográfica (Cidades)
                </h4>
                <span className="text-xs text-neutral-400 font-semibold">Top cidades</span>
              </div>

              {metricas.rankingCidades.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">Nenhum endereço cadastrado ainda.</p>
              ) : (
                <div className="space-y-3.5 pt-1">
                  {metricas.rankingCidades.map((cid, idx) => {
                    const barraPct = pct(cid.qtd, metricas.total);

                    return (
                      <div key={cid.nome} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-neutral-800 dark:text-neutral-200">
                            {idx + 1}. {cid.nome}
                          </span>
                          <span className="text-sky-600 dark:text-sky-400 font-bold">
                            {cid.qtd} ({barraPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${barraPct}%` }}
                            className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: TODOS OS CADASTROS (APENAS PARA O ADMINISTRADOR)        */}
      {/* ============================================================== */}
      {abaAtiva === 'todos' && userRole === 'admin' && (
        <div className="space-y-4 no-print">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
            <div className="md:col-span-2">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CPF ou e-mail..."
                className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-iba-green"
              />
            </div>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-iba-green"
            >
              <option value="todos">Todos os Registros ({membros.length})</option>
              <option value="membro">Apenas Membros Ativos</option>
              <option value="congregante">Apenas Congregantes</option>
            </select>
          </div>

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
                        className="rounded text-iba-green cursor-pointer"
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
                          <span className="w-4 h-4 border-2 border-iba-green border-t-transparent rounded-full animate-spin" />
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
                            estaSelecionado ? 'bg-iba-green/5 dark:bg-iba-green/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={estaSelecionado}
                              onChange={() => toggleSelecionarUm(m.id)}
                              className="rounded text-iba-green cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">{m.nome}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                m.arrolamento === 'ADMISSÃO'
                                  ? 'bg-iba-green/10 text-iba-green'
                                  : 'bg-emerald-500/10 text-emerald-600'
                              }`}
                            >
                              {m.arrolamento === 'ADMISSÃO' ? 'Membro' : 'Congregante'}
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
                                setExcluindoEmLoteDuplicados(false);
                                setModalExclusaoAberto(true);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5 rounded-lg transition-colors font-bold cursor-pointer"
                              title="Excluir do Banco de Dados"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
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
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: AUDITORIA DE DUPLICADOS (APENAS PARA O ADMINISTRADOR)   */}
      {/* ============================================================== */}
      {abaAtiva === 'duplicados' && userRole === 'admin' && (
        <div className="space-y-6 animate-fadeIn no-print">
          {/* BANNER DE AÇÃO EM LOTE */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {gruposDuplicados.length === 0
                  ? 'Nenhum cadastro duplicado encontrado no banco de dados!'
                  : `${gruposDuplicados.length} pessoa(s) com cadastro duplicado`}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Identificamos {todosIdsDuplicadosParaRemover.length} linha(s) redundante(s) associada(s) a essas{' '}
                {gruposDuplicados.length} pessoas. O registro mais completo será preservado.
              </p>
            </div>

            {gruposDuplicados.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMembroParaExcluirUnico(null);
                  setExcluindoEmLoteDuplicados(true);
                  setConfirmouBackup(false);
                  setModalExclusaoAberto(true);
                }}
                className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Excluir {todosIdsDuplicadosParaRemover.length} Linhas Extras
              </button>
            )}
          </div>

          {/* LISTA COMPARATIVA DOS DUPLICADOS */}
          {gruposDuplicados.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-xs text-neutral-500">
              Todos os cadastros do banco estão íntegros e sem duplicidade.
            </div>
          ) : (
            <div className="space-y-5">
              {gruposDuplicados.map((grupo, idx) => (
                <div
                  key={grupo.chave}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{grupo.nomeExibicao}</h4>
                    </div>
                    <span className="text-[11px] text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full font-bold">
                      {grupo.duplicatas.length + 1} registros encontrados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* REGISTRO PRINCIPAL */}
                    <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                          ✓ Registro Principal (Ficará no Banco)
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {calcularCompletude(grupo.principal)} pts de dados
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                        <p>
                          <strong>Nome:</strong> {grupo.principal.nome}
                        </p>
                        <p>
                          <strong>CPF:</strong> {grupo.principal.cpf || '—'}
                        </p>
                        <p>
                          <strong>Celular:</strong> {grupo.principal.celular || '—'}
                        </p>
                        <p>
                          <strong>E-mail:</strong> {grupo.principal.email || '—'}
                        </p>
                        <p>
                          <strong>Cidade/UF:</strong>{' '}
                          {grupo.principal.cidade ? `${grupo.principal.cidade} / ${grupo.principal.uf}` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* REGISTROS DUPLICADOS */}
                    <div className="space-y-3">
                      {grupo.duplicatas.map((dup, dIdx) => (
                        <div
                          key={dup.id}
                          className="p-4 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-2 flex justify-between items-start"
                        >
                          <div className="text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 uppercase tracking-wider">
                              ✕ Duplicata #{dIdx + 1} (Incompleta)
                            </span>
                            <p className="mt-1">
                              <strong>Nome:</strong> {dup.nome}
                            </p>
                            <p>
                              <strong>CPF:</strong> {dup.cpf || <span className="text-red-500 font-bold">—</span>}
                            </p>
                            <p>
                              <strong>Celular:</strong>{' '}
                              {dup.celular || <span className="text-red-500 font-bold">—</span>}
                            </p>
                            <p>
                              <strong>E-mail:</strong> {dup.email || <span className="text-red-500 font-bold">—</span>}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setMembroParaExcluirUnico(dup);
                              setExcluindoEmLoteDuplicados(false);
                              setModalExclusaoAberto(true);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Excluir apenas esta duplicata"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            <span>Remover</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL GLOBAL DE CONFIRMAÇÃO DE EXCLUSÃO (COM BACKUP PREVENTIVO) */}
      {mounted && modalExclusaoAberto && userRole === 'admin' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999999] animate-fadeIn no-print">
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {excluindoEmLoteDuplicados ? 'Limpeza em Lote de Duplicados' : 'Confirmar Exclusão no Banco?'}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {excluindoEmLoteDuplicados ? (
                  <>
                    Você está prestes a remover <strong className="text-red-500">{todosIdsDuplicadosParaRemover.length} registro(s) duplicados e incompletos</strong> no Supabase, preservando o cadastro mais completo de cada membro.
                  </>
                ) : membroParaExcluirUnico ? (
                  <>
                    Você está prestes a remover a duplicata de <strong className="text-neutral-900 dark:text-white">{membroParaExcluirUnico.nome}</strong> diretamente do banco de dados.
                  </>
                ) : (
                  <>
                    Você está prestes a remover <strong className="text-red-500">{selecionados.length} registro(s)</strong> selecionados diretamente do banco de dados.
                  </>
                )}
                <br />Esta ação é permanente e irreversível no banco de dados.
              </p>
            </div>

            {/* BLOCO DE BACKUP PREVENTIVO */}
            {excluindoEmLoteDuplicados && (
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <svg className="w-4 h-4 text-amber-600 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Backup de Segurança Preventivo</span>
                  </div>
                  <button
                    type="button"
                    onClick={exportarSQL}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer flex-none"
                  >
                    <span>Baixar Backup SQL Agora</span>
                  </button>
                </div>

                <label className="flex items-start gap-2.5 pt-1 text-xs text-amber-900 dark:text-amber-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmouBackup}
                    onChange={(e) => setConfirmouBackup(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="leading-snug">
                    Confirmo que baixei ou já possuo o backup preventivo deste banco antes de prosseguir com a exclusão.
                  </span>
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => {
                  setModalExclusaoAberto(false);
                  setMembroParaExcluirUnico(null);
                  setExcluindoEmLoteDuplicados(false);
                  setConfirmouBackup(false);
                }}
                className="w-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo || (excluindoEmLoteDuplicados && !confirmouBackup)}
                onClick={confirmarExclusao}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {excluindo ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Confirmar e Limpar Banco</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* TOAST DE NOTIFICAÇÃO */}
      {mounted && toastNotificacao && createPortal(
        <div className="fixed bottom-6 left-6 z-[999999] animate-fadeIn transition-all pointer-events-auto no-print">
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