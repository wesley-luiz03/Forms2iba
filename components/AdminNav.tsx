'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Cadastros' },
  { href: '/admin/campos', label: 'Campos do Formulário' },
  { href: '/admin/configuracoes', label: 'Configurações' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <nav className="bg-iba-dark dark:bg-neutral-900 text-iba-cream px-6 py-4 border-b-[3px] border-iba-gold flex items-center justify-between flex-wrap gap-4 font-sans shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="flex items-center gap-5">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/10 dark:bg-white/5 hover:bg-white/20 text-white px-3 py-2 rounded border border-white/10 transition-all duration-300 ease-in-out transform hover:-translate-x-0.5 active:scale-95"
        >
          ← Voltar ao Início
        </Link>
        <div className="h-5 w-[1px] bg-white/20 hidden sm:block" />
        <div className="flex gap-1 sm:gap-4">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-all duration-300 ease-in-out ${
                  isActive 
                    ? 'bg-iba-gold text-white font-semibold shadow-sm' 
                    : 'text-iba-cream/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm transition-all duration-300 ease-in-out transform active:scale-95"
      >
        Sair
      </button>
    </nav>
  );
}