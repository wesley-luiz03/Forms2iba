'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (identificador.trim() === 'wesley2iba' && password === '#soDeussabe') {
      localStorage.setItem('dev_authenticated', 'true');
      document.cookie = "dev_authenticated=true; path=/; max-age=86400; SameSite=Lax";
      window.location.replace('/admin');
    } else {
      setError('Credenciais inválidas. Verifique o usuário e a senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-iba-blue block">
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
              placeholder="Login Admin"
              className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-blue"
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
              className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-iba-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-iba-blue hover:bg-iba-dark text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}