import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/AdminNav';
import AdminDashboardClient from '@/components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: membros }, { data: customFields }, { data: config }] = await Promise.all([
    supabase.from('membros').select('*').order('created_at', { ascending: false }),
    supabase.from('campos_customizados').select('*').order('ordem', { ascending: true }),
    supabase.from('configuracoes').select('*').eq('id', 1).maybeSingle(),
  ]);

  return (
    <div className="min-h-screen bg-iba-cream dark:bg-neutral-950 text-iba-dark dark:text-white font-sans transition-colors duration-300">
      <AdminNav />
      <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
        <AdminDashboardClient
          initialMembros={membros || []}
          customFields={customFields || []}
          config={{
            igreja: config?.igreja || '2ª Igreja Batista de Areias',
            arrolamento: config?.arrolamento || 'ADMISSÃO',
            motivo: config?.motivo || 'RECADASTRAMENTO',
          }}
        />
      </div>
    </div>
  );
}