'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { EKLESIA_COLUMNS } from '@/lib/eklesiaColumns';

interface Membro {
  id: string;
  nome: string;
  sexo: string | null;
  data_nascimento: string | null;
  estado_civil: string | null;
  cpf: string | null;
  celular: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  nome_conjuge: string | null;
  observacao: string | null;
  campos_extra: Record<string, string> | null;
  created_at: string;
}

interface CustomField {
  id: string;
  chave: string;
  rotulo: string;
  tipo: string;
  obrigatorio: boolean;
}

interface Config {
  igreja: string;
  arrolamento: string;
  motivo: string;
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sqlEsc(v: any) {
  if (v === undefined || v === null || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

export default function AdminDashboardClient({
  initialMembros,
  customFields,
  config,
}: {
  initialMembros: Membro[];
  customFields: CustomField[];
  config: Config;
}) {
  const router = useRouter();
  const [membros, setMembros] = useState(initialMembros);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return membros.filter((m) => {
      if (q && !(m.nome || '').toLowerCase().includes(q)) return false;
      if (genderFilter && m.sexo !== genderFilter) return false;
      return true;
    });
  }, [membros, search, genderFilter]);

  const stats = useMemo(() => {
    const total = membros.length;
    const masc = membros.filter((m) => m.sexo === 'Masculino').length;
    const fem = membros.filter((m) => m.sexo === 'Feminino').length;
    const semEmail = membros.filter((m) => !(m.email || '').trim()).length;
    return { total, masc, fem, semEmail };
  }, [membros]);

  async function handleDelete(m: Membro) {
    if (!confirm(`Excluir o cadastro de "${m.nome}"? Essa ação não pode ser desfeita.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('membros').delete().eq('id', m.id);
    if (error) {
      alert('Não foi possível excluir agora. Tente novamente.');
      return;
    }
    setMembros((prev) => prev.filter((x) => x.id !== m.id));
  }

  function handleRefresh() {
    router.refresh();
  }

  function handleExportXlsx() {
    if (filtered.length === 0) return alert('Não há cadastros para exportar.');
    const XLSX = require('xlsx');
    const extraHeaders = customFields.map((f) => f.rotulo);
    const headers = [...EKLESIA_COLUMNS, ...extraHeaders];

    const rows = filtered.map((m) => {
      const row: Record<string, string> = {
        Igreja: config.igreja || '',
        ArrolamentoData: '',
        DescricaoArrolamentoMembro: config.arrolamento || '',
        MotivoArrolamento: config.motivo || '',
        ArrolamentoObservacao: m.observacao || '',
        Codigo: '',
        Nome: m.nome || '',
        Apelido: '',
        Sexo: m.sexo || '',
        DataNascimento: m.data_nascimento || '',
        Rg: '',
        Cpf: m.cpf || '',
        TipoSanguineo: '',
        Doador: '',
        DescricaoEscolaridade: '',
        DescricaoEstadoCivil: m.estado_civil || '',
        Natural: '',
        Pai: '',
        Mae: '',
        DataBatismoEspiritoSanto: '',
        Cep: m.cep || '',
        Endereco: m.endereco || '',
        Numero: m.numero || '',
        Complemento: m.complemento || '',
        Bairro: m.bairro || '',
        Cidade: m.cidade || '',
        Uf: m.uf || '',
        Telefone: '',
        Celular: m.celular || '',
        TelefoneRecado: '',
        Recado: '',
        Email: m.email || '',
        Http: '', Skype: '', FaceBook: '', Twitter: '',
        Empresa_Nome: '', Empresa_Cep: '', Empresa_Endereco: '', Empresa_Numero: '', Empresa_Complemento: '',
        Empresa_Cidade: '', Empresa_Uf: '', Empresa_Bairro: '', Empresa_Telefone: '', Empresa_Celular: '',
        Empresa_TelefoneRecado: '', Empresa_Recado: '', Empresa_Profissao: '', Empresa_Email: '', Empresa_Http: '',
        NomeParceiro: m.nome_conjuge || '',
        DataUniao: '',
      };
      customFields.forEach((f) => {
        row[f.rotulo] = (m.campos_extra && m.campos_extra[f.chave]) || '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Importação EKLESIA 1.0');
    XLSX.writeFile(wb, `cadastro_membresia_2iba_${todayStamp()}.xlsx`);
  }

  function handleExportSql() {
    if (filtered.length === 0) return alert('Não há cadastros para exportar.');
    const baseCols = ['nome', 'sexo', 'data_nascimento', 'estado_civil', 'cpf', 'celular', 'email', 'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'nome_conjuge', 'observacao'];
    const extraCols = customFields.map((f) => f.chave);
    const allCols = [...baseCols, ...extraCols, 'cadastrado_em'];

    const lines: string[] = [];
    lines.push(`-- Exportado do formulário de cadastro de membresia 2IBA em ${todayStamp()}`);
    lines.push('CREATE TABLE IF NOT EXISTS membros_2iba_export (');
    lines.push('  id SERIAL PRIMARY KEY,');
    lines.push(
      [...baseCols, ...extraCols].map((c) => `  ${c} TEXT`).join(',\n') + ','
    );
    lines.push('  cadastrado_em TIMESTAMP');
    lines.push(');');
    lines.push('');

    filtered.forEach((m) => {
      const values: any[] = [
        m.nome, m.sexo, m.data_nascimento, m.estado_civil, m.cpf, m.celular, m.email,
        m.cep, m.endereco, m.numero, m.complemento, m.bairro, m.cidade, m.uf,
        m.nome_conjuge, m.observacao,
      ];
      extraCols.forEach((k) => values.push(m.campos_extra ? m.campos_extra[k] : ''));
      values.push(m.created_at);
      lines.push(`INSERT INTO membros_2iba_export (${allCols.join(', ')}) VALUES (${values.map(sqlEsc).join(', ')});`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cadastro_membresia_2iba_${todayStamp()}.sql`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleExportPdf() {
    if (filtered.length === 0) return alert('Não há cadastros para exportar.');
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 34;
    const navy: [number, number, number] = [0, 17, 120];
    const gold: [number, number, number] = [232, 187, 0];
    const cols: { key: keyof Membro; label: string; w: number }[] = [
      { key: 'nome', label: 'Nome', w: 150 },
      { key: 'sexo', label: 'Sexo', w: 60 },
      { key: 'data_nascimento', label: 'Nascimento', w: 70 },
      { key: 'celular', label: 'Celular', w: 85 },
      { key: 'email', label: 'E-mail', w: 140 },
      { key: 'cidade', label: 'Cidade', w: 80 },
      { key: 'uf', label: 'UF', w: 30 },
      { key: 'estado_civil', label: 'Estado civil', w: 80 },
    ];

    function drawHeader() {
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageW, 50, 'F');
      doc.setDrawColor(...gold);
      doc.setLineWidth(2.5);
      doc.line(0, 50, pageW, 50);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('2ª Igreja Batista de Areias — Cadastro de Membresia', margin, 30);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Exportado em ${new Date().toLocaleDateString('pt-BR')} · ${filtered.length} cadastro(s)`, margin, 44);
    }

    function drawTableHead(y: number) {
      doc.setFillColor(...navy);
      doc.rect(margin, y, pageW - margin * 2, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      let x = margin + 4;
      cols.forEach((c) => {
        doc.text(c.label, x, y + 13);
        x += c.w;
      });
      return y + 20;
    }

    let y = 70;
    drawHeader();
    y = drawTableHead(y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 35);

    filtered.forEach((m, idx) => {
      if (y > pageH - 40) {
        doc.addPage();
        drawHeader();
        y = drawTableHead(70);
      }
      if (idx % 2 === 0) {
        doc.setFillColor(247, 247, 250);
        doc.rect(margin, y, pageW - margin * 2, 18, 'F');
      }
      let x = margin + 4;
      cols.forEach((c) => {
        let val = String((m as any)[c.key] || '—');
        if (val.length > 30) val = val.slice(0, 28) + '…';
        doc.text(val, x, y + 12);
        x += c.w;
      });
      y += 18;
    });

    doc.save(`cadastro_membresia_2iba_${todayStamp()}.pdf`);
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 pt-8 pb-16">
      <div className="flex justify-between items-end flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-navy text-2xl m-0 mb-1">Painel de cadastros</h2>
          <div className="text-xs text-gray-500">{membros.length} cadastro(s) recebido(s)</div>
        </div>
        <button onClick={handleRefresh} className="border border-navy text-navy text-xs font-bold px-4 py-2 rounded">
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <Stat n={stats.total} l="Total de cadastros" />
        <Stat n={stats.masc} l="Masculino" />
        <Stat n={stats.fem} l="Feminino" />
        <Stat n={stats.semEmail} l="Sem e-mail" />
      </div>

      <div className="flex justify-between flex-wrap gap-3 mb-4">
        <div className="flex gap-2.5 flex-wrap">
          <input
            type="text"
            placeholder="Pesquisar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-navy/15 rounded px-3 py-2 text-sm"
          />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="border border-navy/15 rounded px-3 py-2 text-sm"
          >
            <option value="">Todos os sexos</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportXlsx} className="bg-gold text-navy-ink text-xs font-bold px-4 py-2 rounded">
            Baixar XLSX (Eklesia)
          </button>
          <button onClick={handleExportPdf} className="border border-navy text-navy text-xs font-bold px-4 py-2 rounded">
            Baixar PDF
          </button>
          <button onClick={handleExportSql} className="border border-navy text-navy text-xs font-bold px-4 py-2 rounded">
            Baixar SQL
          </button>
        </div>
      </div>

      <div className="border border-navy/15 rounded overflow-auto max-h-[560px]">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr>
              {['Nome', 'Sexo', 'Celular', 'Cidade/UF', 'Cadastrado em', ''].map((h) => (
                <th key={h} className="bg-navy text-cream text-left text-[11px] uppercase tracking-wide px-3 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-9">
                  Nenhum cadastro encontrado.
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-navy-soft">
                <td className="px-3 py-2.5 text-sm border-b border-navy/10">{m.nome || '—'}</td>
                <td className="px-3 py-2.5 text-sm border-b border-navy/10">
                  {m.sexo ? <span className="bg-navy-soft text-navy text-[11px] px-2 py-0.5 rounded-full">{m.sexo}</span> : '—'}
                </td>
                <td className="px-3 py-2.5 text-sm border-b border-navy/10">{m.celular || '—'}</td>
                <td className="px-3 py-2.5 text-sm border-b border-navy/10">
                  {[m.cidade, m.uf].filter(Boolean).join(' / ') || '—'}
                </td>
                <td className="px-3 py-2.5 text-sm border-b border-navy/10">
                  {new Date(m.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-3 py-2.5 text-sm border-b border-navy/10">
                  <button onClick={() => handleDelete(m)} className="text-red-600 border border-red-600 text-xs font-bold px-2.5 py-1 rounded">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="bg-white border border-navy/15 border-l-4 border-l-gold rounded px-4 py-3.5">
      <div className="text-2xl text-navy font-bold">{n}</div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{l}</div>
    </div>
  );
}
