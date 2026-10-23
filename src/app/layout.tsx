import type { Metadata } from 'next';
import { Inter, Source_Code_Pro } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono',
});

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
    <html lang="es" className="h-full">
      <body className={`${inter.variable} ${sourceCodePro.variable} font-sans antialiased bg-background text-foreground min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
