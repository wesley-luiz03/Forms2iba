import { createClient } from '@/lib/supabase/server';
import MemberForm from '@/components/MemberForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient(); // Adicione o await aqui
  const { data: customFields } = await supabase
    .from('campos_customizados') // Agora o .from() vai funcionar perfeitamente!
    .select('*')
    .order('ordem', { ascending: true });

  return (
    <div className="min-h-screen pb-16">
      <div className="bg-navy text-cream px-7 py-6 border-b-[3px] border-gold flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-gold">
            2ª Igreja Batista de Areias
          </span>
          <h1 className="text-[22px] font-semibold m-0">Cadastro de Membresia</h1>
        </div>
        <Link href="/admin" className="text-cream/80 text-sm hover:text-white hover:border-b hover:border-gold">
          Área do desenvolvedor
        </Link>
      </div>

      <div className="max-w-[880px] mx-auto px-5 pt-9">
        <div className="text-center mb-7">
          <h2 className="text-[28px] text-navy m-0 mb-2">Atualize seus dados</h2>
          <p className="text-gray-500 text-sm max-w-[560px] mx-auto leading-relaxed">
            Preencha suas informações com calma — leva poucos minutos. Esses dados serão usados
            para organizar o cadastro de membros da igreja no sistema Eklesia.
          </p>
        </div>

        <MemberForm customFields={customFields || []} />

        <div className="text-center mt-6 text-xs text-gray-500">
          Precisa corrigir algo depois de enviar? Fale com a equipe de Comunicação da igreja.
        </div>
      </div>
    </div>
  );
}
