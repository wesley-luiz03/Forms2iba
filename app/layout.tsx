import type { Metadata } from "next";
import ThemeToggle from "@/components/ThemeToggle";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Cadastro de Membresia — 2ª Igreja Batista de Areias",
  description: "Formulário de atualização de dados para importação no Eklesia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased bg-iba-cream dark:bg-neutral-950 text-iba-dark dark:text-white min-h-screen transition-colors duration-300">
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}