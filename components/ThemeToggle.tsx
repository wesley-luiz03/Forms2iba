'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já tinha escolhido o dark mode antes
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="fixed bottom-6 right-6 z-50 bg-white dark:bg-iba-darkCard border border-iba-dark/10 dark:border-white/10 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 text-xl flex items-center justify-center focus:outline-none group"
      aria-label="Alternar modo de cores"
    >
      {darkMode ? (
        <span className="animate-pulse">☀️</span> // Ícone Sol no Dark Mode
      ) : (
        <span className="animate-pulse">🌙</span> // Ícone Lua no Light Mode
      )
    }
    </button>
  );
}