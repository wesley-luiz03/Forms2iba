'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BASE_FIELDS, SECTIONS, type FieldDef } from '@/lib/fields';

interface CustomField {
  id: string;
  chave: string;
  rotulo: string;
  tipo: 'texto' | 'multipla' | 'data' | 'numero';
  opcoes: string[] | null;
  obrigatorio: boolean;
}

export default function MemberForm({ customFields }: { customFields: CustomField[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const extraAsFieldDefs: FieldDef[] = customFields.map((f) => ({
    key: f.chave,
    label: f.rotulo,
    type: f.tipo,
    required: f.obrigatorio,
    options: f.opcoes || [],
    section: 'extra',
  }));

  const allFields = [...BASE_FIELDS, ...extraAsFieldDefs];

  function setVal(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    for (const f of allFields) {
      if (f.required && !(values[f.key] || '').trim()) {
        setError(`Por favor preencha o campo "${f.label}" antes de enviar.`);
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();

    const campos_extra: Record<string, string> = {};
    extraAsFieldDefs.forEach((f) => {
      if (values[f.key] !== undefined) campos_extra[f.key] = values[f.key];
    });

    const { error: insertError } = await supabase.from('membros').insert({
      nome: values.nome || null,
      sexo: values.sexo || null,
      data_nascimento: values.data_nascimento || null,
      estado_civil: values.estado_civil || null,
      cpf: values.cpf || null,
      celular: values.celular || null,
      email: values.email || null,
      cep: values.cep || null,
      endereco: values.endereco || null,
      numero: values.numero || null,
      complemento: values.complemento || null,
      bairro: values.bairro || null,
      cidade: values.cidade || null,
      uf: values.uf || null,
      nome_conjuge: values.nome_conjuge || null,
      observacao: values.observacao || null,
      campos_extra,
    });

    setLoading(false);

    if (insertError) {
      setError('Não foi possível enviar seu cadastro agora. Verifique sua conexão e tente novamente.');
      return;
    }

    router.push('/sucesso');
  }

  function renderInput(f: FieldDef) {
    if (f.type === 'multipla') {
      return (
        <select
          value={values[f.key] || ''}
          onChange={(e) => setVal(f.key, e.target.value)}
          required={f.required}
          className="border border-navy/15 bg-cream focus:bg-white focus:outline-gold rounded px-3 py-2.5 text-[14.5px]"
        >
          <option value="">Selecione…</option>
          {(f.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    const type = f.type === 'data' ? 'date' : f.type === 'numero' ? 'number' : 'text';
    return (
      <input
        type={type}
        value={values[f.key] || ''}
        onChange={(e) => setVal(f.key, e.target.value)}
        required={f.required}
        className="border border-navy/15 bg-cream focus:bg-white focus:outline-gold rounded px-3 py-2.5 text-[14.5px]"
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-navy/15 rounded">
      {error && (
        <div className="mx-7 mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-4 py-2.5">
          {error}
        </div>
      )}

      {SECTIONS.map((sec, idx) => {
        const fields = allFields.filter((f) => f.section === sec.id);
        if (fields.length === 0) return null;
        return (
          <div key={sec.id} className="p-7 border-b border-navy/15 last:border-b-0">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="w-6 h-6 rounded-full bg-navy text-gold text-xs font-bold flex items-center justify-center flex-none">
                {idx + 1}
              </span>
              <h3 className="text-navy text-[17px] font-semibold m-0">{sec.title}</h3>
            </div>
            {sec.hint && <p className="text-xs text-gray-500 ml-9 mb-4">{sec.hint}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {fields.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy-ink">
                    {f.label}
                    {f.required && <span className="text-red-600 ml-0.5">*</span>}
                  </label>
                  {renderInput(f)}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="p-7 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-navy text-white font-bold text-sm px-6 py-3 rounded disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar cadastro'}
        </button>
      </div>
    </form>
  );
}
