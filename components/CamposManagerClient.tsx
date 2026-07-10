'use client';

import { useState } from 'react';

export default function CamposManagerClient({ initialFields }: any) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('texto');
  const [obrigatorio, setObrigatorio] = useState(false);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Campos do formulário</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Adicione perguntas extras que aparecerão no formulário público.</p>
      </div>

      {/* Bloco 1: Listagem */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm transition-all duration-300">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white mb-4">Campos adicionais atuais</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Nenhum campo adicional ainda.</p>
      </div>

      {/* Bloco 2: Criação de campos */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm transition-all duration-300 space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">Adicionar novo campo</h2>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Nome do campo</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Ministério que participa"
            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue transition-all duration-300 w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Tipo do campo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue transition-all duration-300 w-full"
          >
            <option value="texto">Escrito (texto livre)</option>
            <option value="multipla">Múltipla escolha</option>
            <option value="data">Data</option>
            <option value="numero">Número</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="req"
            checked={obrigatorio}
            onChange={(e) => setObrigatorio(e.target.checked)}
            className="w-4 h-4 text-iba-blue border-neutral-300 rounded focus:ring-iba-blue"
          />
          <label htmlFor="req" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">Campo obrigatório</label>
        </div>
      </div>
    </div>
  );
}