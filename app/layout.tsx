import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cadastro de Membresia — 2ª Igreja Batista de Areias',
  description: 'Formulário de atualização de dados dos membros da 2IBA para importação no Eklesia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
