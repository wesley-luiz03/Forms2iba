import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/AdminNav';
import CamposManagerClient from '@/components/CamposManagerClient';

export const dynamic = 'force-dynamic';

export default async function CamposPage() {
  const supabase = createClient();
  const { data: customFields } = await supabase
    .from('campos_customizados')
    .select('*')
    .order('ordem', { ascending: true });

  return (
    <div className="min-h-screen">
      <AdminNav />
      <CamposManagerClient initialFields={customFields || []} />
    </div>
  );
}
