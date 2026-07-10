'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (username === '2ibAdmin' && password === '#soDeussabe') {
      document.cookie = "admin_session=true; path=/; max-age=86400; SameSite=Strict";
      router.push('/admin');
      router.refresh();
    } else {
      setError('Usuário ou senha incorretos.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-iba-cream dark:bg-neutral-950 flex flex-col items-center justify-center px-5 font-sans transition-all duration-300">
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-iba-dark dark:text-neutral-300 hover:text-iba-dark dark:hover:text-white bg-white dark:bg-neutral-900 hover:bg-white/80 px-4 py-2 rounded-full border border-iba-dark/10 dark:border-neutral-800 shadow-sm transition-all duration-300 transform active:scale-95"
      >
        ← Voltar ao Formulário Público
      </Link>

      <div className="bg-white dark:bg-neutral-900 border border-iba-dark/10 dark:border-neutral-800 rounded-xl max-w-[400px] w-full p-8 shadow-xl transition-all duration-300">
        <div className="w-12 h-1 bg-iba-gold mx-auto rounded-full mb-6" />
        <h2 className="text-iba-dark dark:text-white text-center font-display text-2xl font-bold mb-1">
          Área do Desenvolvedor
        </h2>
        <p className="text-iba-dark/60 dark:text-neutral-400 text-center text-sm mb-6">
          Acesso restrito à equipe responsável pela importação de dados da 2IBA.
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-iba-dark/80 dark:text-neutral-300">Login</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-iba-dark/15 dark:border-neutral-700 bg-iba-cream/30 dark:bg-neutral-800 text-black dark:text-white focus:border-iba-blue focus:ring-2 focus:ring-iba-blue/10 rounded-lg px-4 py-3 text-sm outline-none transition-all duration-300"
              placeholder="Digite o usuário administrador"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-iba-dark/80 dark:text-neutral-300">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-iba-dark/15 dark:border-neutral-700 bg-iba-cream/30 dark:bg-neutral-800 text-black dark:text-white focus:border-iba-blue focus:ring-2 focus:ring-iba-blue/10 rounded-lg px-4 py-3 text-sm outline-none transition-all duration-300"
              placeholder="Digite a senha de segurança"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-iba-blue hover:bg-iba-dark dark:hover:bg-iba-blue/80 text-white font-bold text-sm px-6 py-3.5 rounded-lg shadow-md transition-all duration-300 transform active:scale-[0.98] mt-2"
          >
            {loading ? 'Autenticando…' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}