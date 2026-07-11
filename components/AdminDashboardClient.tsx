'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Membro {
  id: string;
  nome: string;
  genero: string;
  celular: string;
  cidade: string;
  uf: string;
  email: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  estado_civil: string;
  escolaridade: string;
  tipo_sanguineo: string;
  naturalidade: string;
  nome_mae: string;
  nome_pai: string;
  data_batismo: string;
  created_at: string;
}

export default function AdminDashboardClient({ 
  initialMembros, 
  customFields, 
  config 
}: { 
  initialMembros: Membro[]; 
  customFields: any[]; 
  config: any; 
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [loadingExclusao, setLoadingExclusao] = useState(false);

  // Filtros em tempo real
  const filtrados = initialMembros.filter((m) => {
    const bateNome = m.nome?.toLowerCase().includes(search.toLowerCase());
    const bateGenero = genderFilter === '' || m.genero === genderFilter;
    return bateNome && bateGenero;
  });

  // Alvos de exportação (se houver itens marcados, exporta os selecionados. Se não, exporta todos os filtrados da tela)
  const dadosParaExportar = selecionados.length > 0 
    ? initialMembros.filter(m => selecionados.includes(m.id)) 
    : filtrados;

  // Contadores
  const total = initialMembros.length;
  const masculino = initialMembros.filter((m) => m.genero === 'Masculino').length;
  const feminino = initialMembros.filter((m) => m.genero === 'Feminino').length;
  const semEmail = initialMembros.filter((m) => !m.email || m.email.trim() === '').length;

  // --- MOTOR 1: EXPORTAÇÃO XLSX (MODELO PLANILHA PADRÃO EKLESIA / 2IBA) ---
  const exportarXLSX = () => {
    if (dadosParaExportar.length === 0) return alert('Nenhum cadastro disponível para exportar.');

    // Mapeamento estruturado de colunas seguindo o dicionário de dados do Eklesia adaptado à 2IBA
    const rows = dadosParaExportar.map(m => ({
      'Nome Completo': m.nome,
      'Gênero': m.genero,
      'Data de Nascimento': m.data_nascimento ? new Date(m.data_nascimento).toLocaleDateString('pt-BR') : '',
      'Estado Civil': m.estado_civil,
      'CPF': m.cpf,
      'RG': m.rg,
      'Celular': m.celular,
      'E-mail': m.email,
      'Cidade Natal': m.naturalidade,
      'Nome da Mãe': m.nome_mae,
      'Nome do Pai': m.nome_pai,
      'Data do Batismo': m.data_batismo,
      'Escolaridade': m.escolaridade,
      'Tipo Sanguíneo': m.tipo_sanguineo || 'Não Informado',
      'Igreja': config.igreja,
      'Situação de Arrolamento': config.arrolamento,
      'Motivo do Arrolamento': config.motivo
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Membros 2IBA');

    // Auto-ajuste de largura de colunas para a planilha não ficar cortada
    const maxProps = Object.keys(rows[0]);
    worksheet['!cols'] = maxProps.map(() => ({ wch: 22 }));

    XLSX.writeFile(workbook, `2iba_membros_eklesia_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

// --- MOTOR 2: EXPORTAÇÃO PDF COMPACTO EM TABELA HORIZONTAL PARA LARGA ESCALA ---
  const exportarPDF = () => {
    if (dadosParaExportar.length === 0) return alert('Nenhum cadastro disponível para exportar.');

    // Mantemos em modo Paisagem (Landscape) para ganhar o máximo de espaço horizontal útil (297mm)
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // 1. CONFIGURAÇÃO DO CABEÇALHO DA PÁGINA (Aparecerá automaticamente em todas as páginas)
    const renderHeader = () => {
      doc.setFillColor(11, 27, 38); // #0B1B26 (iba-dark)
      doc.rect(0, 0, 297, 24, 'F');

      doc.setTextColor(237, 196, 114); // #EDC472 (iba-gold)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('2ª IGREJA BATISTA DE AREIAS', 12, 10);

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Relatório Geral Consolidado de Cadastro — Sistema Eklesia', 12, 17);
      doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} • Total: ${dadosParaExportar.length} registro(s)`, 225, 17);

      // Linha dourada divisória sutil
      doc.setDrawColor(237, 196, 114);
      doc.setLineWidth(0.5);
      doc.line(0, 24, 297, 24);
    };

    renderHeader();

    // 2. ESTRUTURAÇÃO DE TODOS OS CAMPOS ESSENCIAIS EM COLUNAS COMPACTAS
    // Definimos títulos diretos e curtos para salvar preciosos milímetros na tela
    const headers = [[
      'Nome do Membro', 
      'Gênero', 
      'CPF / RG', 
      'Contato / Celular', 
      'E-mail', 
      'Cidade/UF', 
      'Batismo', 
      'Escolaridade / Sangue'
    ]];

    // Mapeamos os registros concatenando dados semelhantes para reduzir o número de colunas
    const body = dadosParaExportar.map(m => {
      const cpfRg = `${m.cpf || '-'}\nRG: ${m.rg || '-'}`;
      const cidadeUf = m.cidade && m.uf ? `${m.cidade}-${m.uf}` : '-';
      const escolaridadeSangue = `${m.escolaridade || '-'}\nSangue: ${m.tipo_sanguineo || 'Não Inf.'}`;
      
      return [
        m.nome,
        m.genero || '-',
        cpfRg,
        m.celular || '-',
        m.email || '-',
        cidadeUf,
        m.data_batismo || '-',
        escolaridadeSangue
      ];
    });

    // 3. RENDERIZAÇÃO DA TABELA INTELIGENTE DE ALTA DENSIDADE (jsPDF-AutoTable)
    autoTable(doc, {
      startY: 28,
      head: headers,
      body: body,
      theme: 'grid',
      // 'linebreak' força o texto a quebrar linha dentro da célula se não couber horizontalmente
      styles: { 
        fontSize: 8, 
        textColor: [40, 40, 40], 
        cellPadding: 1.8, 
        overflow: 'linebreak' 
      },
      headStyles: { 
        fillColor: [11, 27, 38], 
        textColor: [237, 196, 114], 
        fontSize: 8.5, 
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: { 
        fillColor: [249, 250, 251] 
      },
      // Configuração milimétrica da largura de cada coluna para equilibrar a tabela
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' }, // Nome ganha mais espaço
        1: { cellWidth: 18 },                    // Gênero
        2: { cellWidth: 32 },                    // CPF / RG empilhados
        3: { cellWidth: 30 },                    // Celular
        4: { cellWidth: 48 },                    // E-mail quebra linha se for longo
        5: { cellWidth: 32 },                    // Cidade/UF
        6: { cellWidth: 28 },                    // Batismo
        7: { cellWidth: 30 },                    // Escolaridade / Sangue empilhados
      },
      margin: { left: 12, right: 12, bottom: 15 },
      // Lógica para repetir o cabeçalho oficial e adicionar o rodapé caso mude de página
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          renderHeader();
        }
        // Rodapé flutuante por página
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text('2ª Igreja Batista de Areias • Secretaria Interna', 12, 287);
        doc.text(`Página ${data.pageNumber}`, 275, 287);
      }
    });

    doc.save(`2iba_membros_relatorio_${new Date().toISOString().slice(0, 10)}.pdf`);
  };  
  
  // --- MOTOR 3: EXPORTAÇÃO SQL DE DESENVOLVEDOR (INSERT STATEMENT) ---
  const exportarSQL = () => {
    if (dadosParaExportar.length === 0) return alert('Nenhum cadastro disponível para exportar.');

    let sqlDump = `-- 2ª Igreja Batista de Areias - Dump de Cadastros\n`;
    sqlDump += `-- Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;

    dadosParaExportar.forEach(m => {
      const escape = (val: string | null) => val ? `'${val.replace(/'/g, "''")}'` : 'NULL';
      
      sqlDump += `INSERT INTO public.membros (nome, genero, data_nascimento, estado_civil, cpf, rg, celular, email, naturalidade, nome_mae, nome_pai, data_batismo, escolaridade, tipo_sanguineo) VALUES (\n  ${escape(m.nome)},\n  ${escape(m.genero)},\n  ${escape(m.data_nascimento)},\n  ${escape(m.estado_civil)},\n  ${escape(m.cpf)},\n  ${escape(m.rg)},\n  ${escape(m.celular)},\n  ${escape(m.email)},\n  ${escape(m.naturalidade)},\n  ${escape(m.nome_mae)},\n  ${escape(m.nome_pai)},\n  ${escape(m.data_batismo)},\n  ${escape(m.escolaridade)},\n  ${escape(m.tipo_sanguineo)}\n);\n\n`;
    });

    const blob = new Blob([sqlDump], { type: 'text/sql;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `2iba_membros_dump_${new Date().toISOString().slice(0,10)}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Checkboxes de seleção
  const toggleSelecionar = (id: string) => {
    setSelecionados((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleSelecionarTodos = () => {
    if (selecionados.length === filtrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(filtrados.map((m) => m.id));
    }
  };

  const handleExcluirSelecionados = async () => {
    if (selecionados.length === 0) return;
    const confirmacao = window.confirm(`Tem certeza que deseja excluir permanentemente estes ${selecionados.length} cadastro(s)?`);
    if (!confirmacao) return;

    setLoadingExclusao(true);
    const supabase = createClient();
    const { error } = await supabase.from('membros').delete().in('id', selecionados);
    setLoadingExclusao(false);

    if (error) {
      alert(`Erro: ${error.message}`);
    } else {
      setSelecionados([]);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Painel de cadastros</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{total} cadastro(s) recebido(s)</p>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total de Cadastros', val: total },
          { label: 'Masculino', val: masculino },
          { label: 'Feminino', val: feminino },
          { label: 'Sem E-mail', val: semEmail },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{card.val}</span>
            <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Alerta de Itens Selecionados */}
      {selecionados.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center justify-between text-sm">
          <span className="text-red-800 dark:text-red-400 font-semibold">
            ⚡ {selecionados.length} cadastro(s) selecionado(s). As exportações focarão apenas nestes registros.
          </span>
          <button onClick={handleExcluirSelecionados} disabled={loadingExclusao} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg transition-all">
            {loadingExclusao ? 'Excluindo…' : 'Excluir do Banco'}
          </button>
        </div>
      )}

      {/* Barra de Filtros e Botões com as Funções Prontas */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome..."
            className="bg-neutral-50 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-iba-blue"
          />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-neutral-50 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-iba-blue"
          >
            <option value="">Todos os sexos</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportarXLSX} className="text-xs font-bold text-iba-blue dark:text-neutral-300 hover:underline px-3 py-2">
            Baixar XLSX (Eklesia)
          </button>
          <button onClick={exportarPDF} className="text-xs font-bold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2 rounded-lg transition-all">
            Baixar PDF
          </button>
          <button onClick={exportarSQL} className="text-xs font-bold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2 rounded-lg transition-all">
            Baixar SQL
          </button>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {filtrados.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
            Nenhum cadastro encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filtrados.length > 0 && selecionados.length === filtrados.length}
                      onChange={toggleSelecionarTodos}
                      className="w-4 h-4 rounded text-iba-blue border-neutral-300 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Gênero</th>
                  <th className="p-4">Celular</th>
                  <th className="p-4">Cidade/UF</th>
                  <th className="p-4">Cadastrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm text-neutral-900 dark:text-neutral-100">
                {filtrados.map((membro) => {
                  const estaSelecionado = selecionados.includes(membro.id);
                  return (
                    <tr key={membro.id} className={estaSelecionado ? 'bg-iba-blue/5 dark:bg-iba-blue/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}>
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={estaSelecionado}
                          onChange={() => toggleSelecionar(membro.id)}
                          className="w-4 h-4 rounded text-iba-blue border-neutral-300 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-medium">{membro.nome}</td>
                      <td className="p-4">{membro.genero || '-'}</td>
                      <td className="p-4">{membro.celular || '-'}</td>
                      <td className="p-4">{membro.cidade ? `${membro.cidade}/${membro.uf}` : '-'}</td>
                      <td className="p-4 text-xs text-neutral-500">
                        {membro.created_at ? new Date(membro.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}