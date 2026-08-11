import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Financiera Impulso | Gestión de Préstamos y Cobranza',
  description: 'Prototipo de Alta Fidelidad MVP Frontend-First para Gestión de Préstamos, Amortizaciones y Cobranza en Campo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100">{children}</body>
    </html>
  );
}
