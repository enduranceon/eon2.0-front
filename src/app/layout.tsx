import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ColorModeProvider } from '@/contexts/ThemeContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Endurance On - Dashboard',
  description: 'Plataforma de gestão para assessoria esportiva especializada em corrida e triathlon',
  keywords: ['endurance', 'corrida', 'triathlon', 'assessoria esportiva', 'dashboard'],
  authors: [{ name: 'Endurance On' }],
  creator: 'Endurance On',
  publisher: 'Endurance On',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ColorModeProvider>
            <LoadingProvider>
              <NextTopLoader
                color="#7A5CFA"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #7A5CFA,0 0 5px #7A5CFA"
              />
              {children}
              <Toaster richColors position="top-right" />
            </LoadingProvider>
          </ColorModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 