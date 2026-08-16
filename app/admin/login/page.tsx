'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const user = identificador.trim().toLowerCase();
    
    if ((user === 'wesley2iba' || user === '2ibaadmin') && password === '#soDeussabe') {
      localStorage.setItem('dev_authenticated', 'true');
      document.cookie = "dev_authenticated=true; path=/; max-age=86400; SameSite=Lax";
      window.location.href = '/admin';
    } else {
      setError('Credenciais inválidas. Verifique o usuário e a senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-sans bg-iba-cream dark:bg-iba-darkBg">
      <div className="max-w-md w-full bg-white dark:bg-iba-darkCard border border-iba-sand dark:border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-fadeIn">
        {/* LOGO CIRCULAR VERDE */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-white dark:bg-neutral-800 shadow-md border-2 border-iba-sand flex items-center justify-center p-2 overflow-hidden">
          <img
            src="/logo-2iba.png"
            alt="Logo 2IBA"
            className="w-full h-full object-contain rounded-full"
          />
        </div>

        <div className="text-center space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-iba-green block">
            2ª Igreja Batista de Areias
          </span>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Acesso do Desenvolvedor
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Digite suas credenciais para gerenciar os cadastros.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs p-3.5 rounded-xl font-semibold animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Usuário / Login
            </label>
            <input
              type="text"
              required
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder="wesley2iba"
              className="w-full border border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-green focus:ring-2 focus:ring-iba-green/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-green focus:ring-2 focus:ring-iba-green/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-iba-green hover:bg-iba-greenHover text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-iba-sand/50 dark:border-neutral-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-iba-green dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Voltar ao Formulário</span>
          </Link>
        </div>
      </div>
    </div>
  );
}