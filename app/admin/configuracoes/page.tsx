import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/AdminNav';
import SettingsFormClient from '@/components/SettingsFormClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  
  const { data: config } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-iba-cream dark:bg-neutral-950 text-iba-dark dark:text-white font-sans transition-colors duration-300">
      <AdminNav />
      <div className="p-6 max-w-4xl mx-auto animate-fadeIn">
        <SettingsFormClient
          initial={{
            igreja: config?.igreja || '2ª Igreja Batista de Areias',
            arrolamento: config?.arrolamento || 'ADMISSÃO',
            motivo: config?.motivo || 'RECADASTRAMENTO',
          }}
        />
      </div>
    </div>
  );
}