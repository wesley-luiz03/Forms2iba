import type { Metadata, Viewport } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

// Separado do objeto metadata para não quebrar a compilação do Server Component
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Recadastro e Membresia — 2ª Igreja Batista de Areias",
  description: "Formulário oficial de atualização cadastral e membresia da 2ª Igreja Batista de Areias (2IBA).",
  keywords: ["2IBA", "Igreja Batista de Areias", "Recadastro", "Membresia", "Recife"],
  authors: [{ name: "Wesley Luiz Moreira da Silva" }],
  openGraph: {
    title: "Recadastro e Membresia — 2ª Igreja Batista de Areias",
    description: "Atualize os dados da sua família no formulário oficial da 2IBA. Leva poucos minutos!",
    url: "https://www.instagram.com/2ibareias/",
    siteName: "2ª Igreja Batista de Areias",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased bg-iba-cream dark:bg-neutral-950 text-iba-dark dark:text-white min-h-screen flex flex-col justify-between transition-colors duration-300">
        <div>
          {children}
        </div>

        <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md py-6 mt-12 transition-all">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <span>© {new Date().getFullYear()} 2ª Igreja Batista de Areias.</span>
              <span className="hidden sm:inline">•</span>
              <span>Desenvolvido por <strong className="text-neutral-900 dark:text-white">Wesley Luiz Moreira da Silva</strong>.</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/admin/login"
                className="hover:underline text-neutral-500 dark:text-neutral-400 font-semibold"
              >
                Painel do Desenvolvedor
              </Link>
            </div>
          </div>
        </footer>

        <ThemeToggle />
      </body>
    </html>
  );
}