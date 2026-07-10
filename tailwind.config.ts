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
          blue: "#4898ab",
          gold: "#bf8b16",
          goldLight: "#eed499",
          green: "#55804B",
          cream: "#f8eedf",      
          dark: "#1e3d45",       
          // Tons para o modo noturno
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