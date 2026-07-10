'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Membro {
  id: string;
  nome: string;
  genero: string;
  celular: string;
  cidade: string;
  uf: string;
  email: string;
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
  
  // Estado para controlar as IDs dos membros selecionados nos checkboxes
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [loadingExclusao, setLoadingExclusao] = useState(false);

  // Lógica Real de Filtros
  const filtrados = initialMembros.filter((m) => {
    const bateNome = m.nome?.toLowerCase().includes(search.toLowerCase());
    const bateGenero = genderFilter === '' || m.genero === genderFilter;
    return bateNome && bateGenero;
  });

  // Contadores dinâmicos
  const total = initialMembros.length;
  const masculino = initialMembros.filter((m) => m.genero === 'Masculino').length;
  const feminino = initialMembros.filter((m) => m.genero === 'Feminino').length;
  const semEmail = initialMembros.filter((m) => !m.email || m.email.trim() === '').length;

  // Gerenciador de Seleção Individual
  const toggleSelecionar = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Gerenciador de Seleção Global (Selecionar Todos os filtrados da tela)
  const toggleSelecionarTodos = () => {
    if (selecionados.length === filtrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(filtrados.map((m) => m.id));
    }
  };

  // Executa a Query de Deleção em Lote diretamente no Supabase
  const handleExcluirSelecionados = async () => {
    if (selecionados.length === 0) return;
    
    const confirmacao = window.confirm(
      `Tem certeza absoluta que deseja excluir permanentemente estes ${selecionados.length} cadastro(s) do banco de dados?`
    );
    if (!confirmacao) return;

    setLoadingExclusao(true);
    const supabase = createClient();

    // Query direta em lote: DELETE FROM membros WHERE id IN (...selecionados)
    const { error } = await supabase
      .from('membros')
      .delete()
      .in('id', selecionados);

    setLoadingExclusao(false);

    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
    } else {
      setSelecionados([]); // Limpa a seleção
      router.refresh();   // Atualiza o Server Component para trazer a tabela atualizada
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
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm transition-all duration-300">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">{card.val}</span>
            <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* AÇÕES DE EXCLUSÃO FLUTUANTE (Aparece apenas se houver itens marcados) */}
      {selecionados.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center justify-between animate-fadeIn text-sm">
          <span className="text-red-800 dark:text-red-400 font-semibold">
            ⚡ {selecionados.length} cadastro(s) selecionado(s) para gerenciamento.
          </span>
          <button
            onClick={handleExcluirSelecionados}
            disabled={loadingExclusao}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg shadow transition-all duration-300 transform active:scale-95 disabled:opacity-50"
          >
            {loadingExclusao ? 'Excluindo…' : 'Excluir Selecionados do Banco'}
          </button>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all duration-300">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome..."
            className="bg-neutral-50 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-iba-blue transition-all duration-300"
          />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-neutral-50 dark:bg-neutral-800 text-black dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-iba-blue transition-all duration-300"
          >
            <option value="">Todos os sexos</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-xs font-bold text-iba-blue dark:text-neutral-300 hover:underline px-3 py-2">Baixar XLSX (Eklesia)</button>
          <button className="text-xs font-bold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2 rounded-lg transition-all duration-300">Baixar PDF</button>
          <button className="text-xs font-bold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 px-4 py-2 rounded-lg transition-all duration-300">Baixar SQL</button>
        </div>
      </div>

      {/* Tabela Interativa */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
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
                      className="w-4 h-4 rounded text-iba-blue border-neutral-300 focus:ring-iba-blue cursor-pointer"
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
                    <tr 
                      key={membro.id} 
                      className={`transition-colors ${
                        estaSelecionado 
                          ? 'bg-iba-blue/5 dark:bg-iba-blue/10' 
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={estaSelecionado}
                          onChange={() => toggleSelecionar(membro.id)}
                          className="w-4 h-4 rounded text-iba-blue border-neutral-300 focus:ring-iba-blue cursor-pointer"
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