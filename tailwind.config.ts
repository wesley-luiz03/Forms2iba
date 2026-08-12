import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 👈 Ativa o dark mode baseado em classe
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Verdana", "sans-serif"],
        display: ["Verdana", "sans-serif"],
      },
      colors: {
        iba: {
          // Cores da Tabela da Igreja
          green: "#55804B",         // Verde Institucional (#55804B)
          greenLight: "#90d46c",    // Verde Claro (#90d46c)
          greenHover: "#5e8749",    // Verde Auxiliar (#5e8749)
          blue: "#4898ab",          // Azul/Verde Água (#4898ab)
          cream: "#f8eedf",         // Creme Principal (#f8eedf)
          sand: "#eed499",          // Bege/Areia (#eed499)
          gold: "#bf8b16",          // Dourado/Escuro (#bf8b16)
          goldLight: "#c7b944",     // Amarelo Dourado (#c7b944)
          brown: "#8b5216",         // Castanho (#8b5216)
          brownDark: "#775127",     // Marrom Escuro (#775127)
          
          // Compatibilidade e Modo Noturno
          dark: "#000000",       
          darkBg: "#121212",
          darkCard: "#1e1e1e",
          darkInput: "#2d2d2d"
        },
      },
    },
  },
  plugins: [],
};

export default config;