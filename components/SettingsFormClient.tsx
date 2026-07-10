'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsFormClient({
  initial,
}: {
  initial: { igreja: string; arrolamento: string; motivo: string };
}) {
  const router = useRouter();
  const [igreja, setIgreja] = useState(initial.igreja);
  const [arrolamento, setArrolamento] = useState(initial.arrolamento);
  const [motivo, setMotivo] = useState(initial.motivo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase
      .from('configuracoes')
      .update({ igreja, arrolamento, motivo, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    if (!error) {
      setSaved(true);
      router.refresh();
    } else {
      alert('Não foi possível salvar agora. Tente novamente.');
    }
  }

  return (
    <div className="max-w-[560px] mx-auto px-5 pt-8 pb-16">
      <h2 className="text-navy text-2xl mb-1">Configurações de exportação</h2>
      <p className="text-gray-500 text-sm mb-7">
        Esses valores são usados no arquivo exportado para o Eklesia e não são perguntados aos
        membros. Confira se o texto está <strong>idêntico</strong> ao cadastrado no sistema
        Gestão antes de importar.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-navy/15 rounded p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-navy-ink">Nome da igreja (coluna &quot;Igreja&quot;)</label>
          <input
            type="text"
            value={igreja}
            onChange={(e) => setIgreja(e.target.value)}
            className="border border-navy/15 rounded px-3 py-2.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-navy-ink">Arrolamento padrão</label>
          <input
            type="text"
            value={arrolamento}
            onChange={(e) => setArrolamento(e.target.value)}
            placeholder="Ex: ADMISSÃO"
            className="border border-navy/15 rounded px-3 py-2.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-navy-ink">Motivo de arrolamento padrão</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: RECADASTRAMENTO"
            className="border border-navy/15 rounded px-3 py-2.5 text-sm"
          />
        </div>
        <div className="flex justify-end items-center gap-3">
          {saved && <span className="text-xs text-gray-500">Salvo.</span>}
          <button
            type="submit"
            disabled={saving}
            className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
