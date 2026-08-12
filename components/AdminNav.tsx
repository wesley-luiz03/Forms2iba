'use client';

export default function AdminNav() {
  const handleSairDoPainel = () => {
    localStorage.removeItem('dev_authenticated');
    document.cookie = "dev_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    window.location.replace('/admin/login');
  };

  return (
    <nav className="w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 py-3.5 px-4 sm:px-6 lg:px-8 mb-6">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-iba-blue" />
          <span className="text-neutral-900 dark:text-white font-bold tracking-tight">
            2IBA — Painel Administrativo
          </span>
        </div>

        <button
          type="button"
          onClick={handleSairDoPainel}
          className="text-red-500 hover:text-red-600 font-bold hover:underline transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <span>Sair do Painel</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </nav>
  );
}