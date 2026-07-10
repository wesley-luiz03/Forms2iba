import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/AdminNav';
import CamposManagerClient from '@/components/CamposManagerClient';

export const dynamic = 'force-dynamic';

export default async function CamposPage() {
  const supabase = await createClient();
  
  const { data: customFields } = await supabase
    .from('campos_customizados')
    .select('*')
    .order('ordem', { ascending: true });

  return (
    <div className="min-h-screen bg-iba-cream dark:bg-neutral-950 text-iba-dark dark:text-white font-sans transition-colors duration-300">
      <AdminNav />
      <div className="p-6 max-w-6xl mx-auto animate-fadeIn">
        <CamposManagerClient initialFields={customFields || []} />
      </div>
    </div>
  );
}