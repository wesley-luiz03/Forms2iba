'use client';

import Link from 'next/link';

export default function SucessoPage() {
  return (
    <div className="min-h-screen bg-iba-cream dark:bg-neutral-950 flex flex-col items-center justify-center px-5 font-sans transition-colors duration-300">
      
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center rounded-xl max-w-[500px] w-full p-10 shadow-xl transition-all duration-300 animate-fadeIn">
        {/* Ícone de Check customizado com a cor oficial */}
        <div className="w-12 h-12 bg-iba-blue/10 dark:bg-iba-blue/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-6 h-6 text-iba-blue" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-neutral-900 dark:text-white font-display text-2xl font-bold tracking-tight mb-3">
          Cadastro recebido!
        </h2>
        
        <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-8">
          Obrigado por atualizar seus dados. Se precisar, você pode enviar o cadastro de outro familiar agora.
        </p>

        {/* Botão de retorno prático com micro-interação de clique */}
        <Link
          href="/"
          className="inline-block bg-iba-blue hover:bg-iba-dark text-white font-bold text-sm px-6 py-3.5 rounded-lg shadow-md shadow-iba-blue/10 transition-all duration-300 transform active:scale-95"
        >
          Novo Cadastro
        </Link>
      </div>
      
      <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-8 font-medium">
        2ª Igreja Batista de Areias • 2026
      </p>
    </div>
  );
}