'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/admin', label: 'Cadastros' },
  { href: '/admin/campos', label: 'Campos do formulário' },
  { href: '/admin/configuracoes', label: 'Configurações' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="bg-navy text-cream px-7 py-5 border-b-[3px] border-gold flex items-center justify-between flex-wrap gap-3">
      <div>
        <span className="block text-[11px] uppercase tracking-[0.18em] text-gold">
          2ª Igreja Batista de Areias
        </span>
        <h1 className="text-[20px] font-semibold m-0">Painel administrativo</h1>
      </div>
      <nav className="flex items-center gap-5 text-[13px]">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`pb-0.5 ${pathname === l.href ? 'border-b border-gold text-white' : 'text-cream/80 hover:text-white'}`}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/" className="text-cream/80 hover:text-white">Ver formulário</Link>
        <button onClick={handleLogout} className="text-cream/80 hover:text-white underline underline-offset-2">
          Sair
        </button>
      </nav>
    </div>
  );
}
