import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/AdminNav';
import SettingsFormClient from '@/components/SettingsFormClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const supabase = createClient();
  const { data: config } = await supabase.from('configuracoes').select('*').eq('id', 1).single();

  return (
    <div className="min-h-screen">
      <AdminNav />
      <SettingsFormClient
        initial={{
          igreja: config?.igreja || '2ª Igreja Batista de Areias',
          arrolamento: config?.arrolamento || 'ADMISSÃO',
          motivo: config?.motivo || 'RECADASTRAMENTO',
        }}
      />
    </div>
  );
}
