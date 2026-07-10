'use client';

import { useState } from 'react';

export default function SettingsFormClient({ initial }: any) {
  const [igreja, setIgreja] = useState(initial.igreja);
  const [arrolamento, setArrolamento] = useState(initial.arrolamento);
  const [motivo, setMotivo] = useState(initial.motivo);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Configurações de exportação</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Esses valores são usados no arquivo exportado para o Eklesia e não são perguntados aos membros.[cite: 6]
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 shadow-sm transition-all duration-300 space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Nome da igreja (coluna "Igreja")</label>
          <input
            type="text"
            value={igreja}
            onChange={(e) => setIgreja(e.target.value)}
            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue transition-all duration-300 w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Arrolamento padrão</label>
          <input
            type="text"
            value={arrolamento}
            onChange={(e) => setArrolamento(e.target.value)}
            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue transition-all duration-300 w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">Motivo de arrolamento padrão</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-iba-blue transition-all duration-300 w-full"
          />
        </div>
      </div>
    </div>
  );
}