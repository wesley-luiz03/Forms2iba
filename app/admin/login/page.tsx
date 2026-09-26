'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErro(null);
  setCarregando(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Credenciais inválidas.');
        setCarregando(false);
        return;
      }

      // Regista o perfil e estado de autenticação
      localStorage.setItem('dev_authenticated', 'true');
      localStorage.setItem('user_role', data.role);

      // Força a entrada imediata no painel administrativo
      window.location.href = '/admin';
    } catch (err) {
      setErro('Erro de conexão ao tentar autenticar.');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-iba-cream dark:bg-iba-dark p-4 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-neutral-900 border border-iba-sand/80 dark:border-neutral-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 mx-auto rounded-full bg-white dark:bg-neutral-800 shadow-md border-2 border-iba-sand flex items-center justify-center p-1.5 overflow-hidden">
            <img src="/logo-2iba.png" alt="Logo 2IBA" className="w-full h-full object-contain rounded-full" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-iba-green block">
            2ª Igreja Batista de Areias
          </span>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Acesso Administrativo</h2>
          <p className="text-xs text-neutral-500">Digite suas credenciais para gerenciar os cadastros.</p>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Usuário / Login
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="border border-iba-sand dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-green focus:ring-2 focus:ring-iba-green/20 transition-all w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border border-iba-sand dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-green focus:ring-2 focus:ring-iba-green/20 transition-all w-full"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-iba-green hover:bg-iba-greenHover text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {carregando ? 'Validando...' : 'Entrar no Painel'}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-neutral-500 hover:text-iba-green transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Voltar ao Formulário</span>
          </Link>
        </div>
      </div>
    </div>
  );
}