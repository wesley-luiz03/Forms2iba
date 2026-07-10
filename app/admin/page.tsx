import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/AdminNav';
import AdminDashboardClient from '@/components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: membros }, { data: customFields }, { data: config }] = await Promise.all([
    supabase.from('membros').select('*').order('created_at', { ascending: false }),
    supabase.from('campos_customizados').select('*').order('ordem', { ascending: true }),
    supabase.from('configuracoes').select('*').eq('id', 1).single(),
  ]);

  return (
    <div className="min-h-screen">
      <AdminNav />
      <AdminDashboardClient
        initialMembros={membros || []}
        customFields={customFields || []}
        config={{
          igreja: config?.igreja || '',
          arrolamento: config?.arrolamento || '',
          motivo: config?.motivo || '',
        }}
      />
    </div>
  );
}
