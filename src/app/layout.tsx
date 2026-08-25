import type { Metadata, Viewport } from 'next';

import { SiteHeader } from '@/components/site-header';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Tropa PoE2 — Otimizador de Builds',
    template: '%s | Tropa PoE2',
  },
  description:
    'Web app de alta performance para otimização de builds, cálculo de upgrades no Trade, análise de Tablets/Mapas e guia dinâmico de leveling para Path of Exile 2.',
};

export const viewport: Viewport = {
  themeColor: '#0d0d0f',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-poe-bg text-poe-text antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-poe-border py-6 text-center text-xs text-poe-subtle">
          Tropa PoE2 Ecosystem — projeto da comunidade, sem afiliação com Grinding Gear
          Games.
        </footer>
      </body>
    </html>
  );
}
