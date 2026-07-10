import { createClient } from '@/lib/supabase/server';
import MemberForm from '@/components/MemberForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();

  // Puxa as perguntas adicionais criadas dinamicamente pelo admin
  const { data: customFields } = await supabase
    .from('campos_customizados')
    .select('*')
    .order('ordem', { ascending: true });

  return (
    <div className="min-h-screen bg-iba-cream dark:bg-neutral-950 text-iba-dark dark:text-white font-sans transition-colors duration-300">
      
      {/* Cabeçalho Superior da Igreja */}
      <header className="max-w-4xl mx-auto pt-10 pb-6 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-iba-dark/60 dark:text-neutral-400 block mb-1">
            2ª Igreja Batista de Areias
          </span>
          <h1 className="text-3xl font-bold font-display tracking-tight text-neutral-900 dark:text-white">
            Cadastro de Membresia
          </h1>
        </div>

        {/* Link discreto para os administradores acessarem o painel */}
        <Link
          href="/admin/login"
          className="text-sm font-semibold text-iba-blue dark:text-neutral-400 hover:underline bg-white/40 dark:bg-neutral-900/40 px-4 py-2 rounded-full border border-iba-dark/5 dark:border-neutral-800 transition-all duration-300"
        >
          Área do desenvolvedor
        </Link>
      </header>

      {/* Área Central do Formulário Público */}
      <main className="max-w-4xl mx-auto pb-16 px-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">
            Atualize seus dados
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
            Preencha suas informações com calma — leva poucos minutos. Esses dados serão usados para organizar o cadastro de membros da igreja no sistema Eklesia.
          </p>
        </div>

        {/* Renderiza o formulário oficial protegido */}
        <MemberForm customFields={customFields || []} />
      </main>

    </div>
  );
}