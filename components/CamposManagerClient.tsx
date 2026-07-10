'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface CustomField {
  id: string;
  chave: string;
  rotulo: string;
  tipo: 'texto' | 'multipla' | 'data' | 'numero';
  opcoes: string[] | null;
  obrigatorio: boolean;
}

const TIPOS = [
  { value: 'texto', label: 'Escrito (texto livre)' },
  { value: 'multipla', label: 'Múltipla escolha' },
  { value: 'data', label: 'Data' },
  { value: 'numero', label: 'Número' },
];

function slugify(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function CamposManagerClient({ initialFields }: { initialFields: CustomField[] }) {
  const router = useRouter();
  const [fields, setFields] = useState(initialFields);
  const [label, setLabel] = useState('');
  const [tipo, setTipo] = useState<'texto' | 'multipla' | 'data' | 'numero'>('texto');
  const [options, setOptions] = useState('');
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!label.trim()) return;

    let opts: string[] = [];
    if (tipo === 'multipla') {
      opts = options.split(',').map((s) => s.trim()).filter(Boolean);
      if (opts.length < 2) {
        setError('Adicione pelo menos duas opções separadas por vírgula.');
        return;
      }
    }

    const chave = `x_${slugify(label)}_${Math.random().toString(36).slice(2, 6)}`;
    setSaving(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from('campos_customizados')
      .insert({
        chave,
        rotulo: label.trim(),
        tipo,
        opcoes: opts,
        obrigatorio: required,
        ordem: fields.length,
      })
      .select()
      .single();
    setSaving(false);

    if (insertError) {
      setError('Não foi possível salvar o campo agora. Tente novamente.');
      return;
    }

    setFields((prev) => [...prev, data as CustomField]);
    setLabel('');
    setOptions('');
    setRequired(false);
    setTipo('texto');
    router.refresh();
  }

  async function handleRemove(f: CustomField) {
    if (!confirm(`Remover o campo "${f.rotulo}" do formulário? Os dados já enviados para esse campo não serão apagados.`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('campos_customizados').delete().eq('id', f.id);
    if (deleteError) {
      alert('Não foi possível remover agora. Tente novamente.');
      return;
    }
    setFields((prev) => prev.filter((x) => x.id !== f.id));
    router.refresh();
  }

  return (
    <div className="max-w-[720px] mx-auto px-5 pt-8 pb-16">
      <h2 className="text-navy text-2xl mb-1">Campos do formulário</h2>
      <p className="text-gray-500 text-sm mb-7">
        Adicione perguntas extras que aparecerão no formulário público, além dos campos padrão.
      </p>

      <div className="bg-white border border-navy/15 rounded p-6 mb-8">
        <h3 className="text-navy text-base font-semibold mb-4">Campos adicionais atuais</h3>
        {fields.length === 0 && <p className="text-sm text-gray-500">Nenhum campo adicional ainda.</p>}
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-2 bg-gold-soft border border-gold text-navy-ink text-xs px-3 py-1.5 rounded-full"
            >
              {f.rotulo}{f.obrigatorio ? ' *' : ''}
              <button onClick={() => handleRemove(f)} className="font-bold" title="Remover campo">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-navy/15 rounded p-6">
        <h3 className="text-navy text-base font-semibold mb-4">Adicionar novo campo</h3>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-2.5 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy-ink">Nome do campo</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Ministério que participa"
              className="border border-navy/15 rounded px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy-ink">Tipo do campo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="border border-navy/15 rounded px-3 py-2.5 text-sm"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {tipo === 'multipla' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy-ink">Opções (separadas por vírgula)</label>
              <input
                type="text"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Ex: Louvor, Transmissão, Recepção"
                className="border border-navy/15 rounded px-3 py-2.5 text-sm"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              id="required-check"
            />
            <label htmlFor="required-check" className="text-sm">Campo obrigatório</label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Adicionar campo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
