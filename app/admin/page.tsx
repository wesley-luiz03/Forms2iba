'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminDashboardClient from '@/components/AdminDashboardClient';

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('dev_authenticated') === 'true';
    if (isAuth) {
      setAutenticado(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (identificador.trim() === 'wesley2iba' && password === '#soDeussabe') {
      sessionStorage.setItem('dev_authenticated', 'true');
      setAutenticado(true);
      setLoading(false);
    } else {
      setError('Credenciais inválidas. Verifique o usuário e a senha.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dev_authenticated');
    setAutenticado(false);
    setPassword('');
  };

  // 1. TELA DE LOGIN (COM BOTÃO DE VOLTAR AO FORMULÁRIO)
  if (!autenticado) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 font-sans bg-iba-cream dark:bg-iba-darkBg">
        <div className="max-w-md w-full bg-white dark:bg-iba-darkCard border border-iba-sand dark:border-neutral-800 rounded-3xl p-8 shadow-xl space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-iba-green block">
              2ª Igreja Batista de Areias
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Acesso do Desenvolvedor
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Digite suas credenciais de administrador para gerenciar os cadastros.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs p-3.5 rounded-xl font-semibold">
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
                className="w-full border border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-green"
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
                className="w-full border border-iba-sand dark:border-neutral-700 bg-white dark:bg-iba-darkInput text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-green"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-iba-green hover:bg-iba-greenHover text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Autenticando...' : 'Entrar no Painel'}
            </button>
          </form>

          {/* BOTÃO PARA VOLTAR AO FORMULÁRIO */}
          <div className="pt-2 text-center border-t border-neutral-100 dark:border-neutral-800">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-iba-green dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Voltar ao Formulário de Cadastros</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. PAINEL ADMIN (APÓS AUTENTICADO)
  return (
    <div className="min-h-screen bg-iba-cream dark:bg-iba-darkBg transition-colors flex flex-col font-sans">
      <nav className="w-full bg-white/80 dark:bg-iba-darkCard/80 backdrop-blur-md border-b border-iba-sand dark:border-neutral-800 py-3.5 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-iba-green" />
            <span className="text-neutral-900 dark:text-white font-bold tracking-tight">
              2IBA — Painel Administrativo
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-bold hover:underline transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <span>Sair do Painel</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex-1">
        <AdminDashboardClient />
      </main>
    </div>
  );
}