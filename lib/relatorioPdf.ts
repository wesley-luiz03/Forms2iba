import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DadosRelatorio {
  total: number;
  membrosAtivos: number;
  congregantes: number;
  homens: number;
  mulheres: number;
  faixasEtarias: { label: string; qtd: number }[];
  rankingMinisterios: { nome: string; qtd: number }[];
  rankingCidades: { nome: string; qtd: number }[];
}

export function gerarRelatorioPdfLideranca(dados: DadosRelatorio) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const verdePrincipal = [85, 128, 75];
  const cinzaEscuro = [40, 40, 40];

  // Cabeçalho
  doc.setFillColor(verdePrincipal[0], verdePrincipal[1], verdePrincipal[2]);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('2ª IGREJA BATISTA DE AREIAS — 2IBA', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Relatório Consolidado de Membresia & Liderança', 14, 18);

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Emissão: ${dataAtual} às ${horaAtual}`, 196, 18, { align: 'right' });

  // Resumo Geral
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. RESUMO EXECUTIVO DA COMUNIDADE', 14, 34);

  const pct = (val: number) => (dados.total > 0 ? `${Math.round((val / dados.total) * 100)}%` : '0%');

  autoTable(doc, {
    startY: 38,
    head: [['Indicador', 'Quantidade', 'Percentual sobre o Total']],
    body: [
      ['Cadastros Únicos Ativos', dados.total.toString(), '100%'],
      ['Membros Efetivos (Admissão)', dados.membrosAtivos.toString(), pct(dados.membrosAtivos)],
      ['Congregantes / Frequentadores', dados.congregantes.toString(), pct(dados.congregantes)],
      ['Homens', dados.homens.toString(), pct(dados.homens)],
      ['Mulheres', dados.mulheres.toString(), pct(dados.mulheres)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [85, 128, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  let posY = (doc as any).lastAutoTable.finalY + 10;

  // Faixas Etárias
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. DISTRIBUIÇÃO ETÁRIA', 14, posY);

  autoTable(doc, {
    startY: posY + 4,
    head: [['Faixa Etária', 'Quantidade', 'Proporção']],
    body: dados.faixasEtarias.map((f) => [f.label, f.qtd.toString(), pct(f.qtd)]),
    theme: 'grid',
    headStyles: {
      fillColor: [70, 70, 70],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  posY = (doc as any).lastAutoTable.finalY + 10;

  // Cidades
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. DISTRIBUIÇÃO TERRITORIAL (TOP CIDADES)', 14, posY);

  autoTable(doc, {
    startY: posY + 4,
    head: [['Cidade', 'Quantidade de Membros', 'Participação']],
    body: dados.rankingCidades.map((c) => [c.nome, c.qtd.toString(), pct(c.qtd)]),
    theme: 'grid',
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  posY = (doc as any).lastAutoTable.finalY + 10;

  if (posY > 220) {
    doc.addPage();
    posY = 20;
  }

  // Ministérios
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. QUADRO DE ATUAÇÃO MINISTERIAL', 14, posY);

  autoTable(doc, {
    startY: posY + 4,
    head: [['Ministério', 'Participantes Ativos']],
    body: dados.rankingMinisterios.length > 0
      ? dados.rankingMinisterios.map((m) => [m.nome, `${m.qtd} pessoas`])
      : [['Nenhum ministério informado', '0']],
    theme: 'grid',
    headStyles: {
      fillColor: [85, 128, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });
// Rodapé em todas as páginas
  const totalPaginas = (doc as any).internal.getNumberOfPages?.() || (doc.internal.pages.length - 1) || 1;

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      'Documento de uso interno confidencial — Secretaria Geral da 2ª Igreja Batista de Areias',
      14,
      290
    );
    doc.text(`Página ${i} de ${totalPaginas}`, 196, 290, { align: 'right' });
  }

  const dataArquivo = new Date().toISOString().split('T')[0];
  doc.save(`2IBA_Relatorio_Executivo_${dataArquivo}.pdf`);
}