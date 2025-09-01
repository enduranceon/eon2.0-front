import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ColorModeProvider } from '@/contexts/ThemeContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { AINotificationProvider } from '@/contexts/AINotificationContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { WebSocketDebugger } from '@/components/WebSocketDebugger';
import { WebSocketConnectionMonitor } from '@/components/WebSocketConnectionMonitor';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';
import { BrowserExtensionProtection } from '@/components/BrowserExtensionProtection';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Regular, Medium, Bold
  variable: '--font-montserrat',
});

const gotham = localFont({
  src: '../assets/fonts/Gotham Ultra Italic.ttf',
  display: 'swap',
  variable: '--font-gotham',
});

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
    <html lang="pt-BR" className={`${montserrat.variable} ${gotham.variable}`}>
      <body>
        <BrowserExtensionProtection />
        <AuthProvider>
          <ColorModeProvider>
            <LoadingProvider>
              <AINotificationProvider>
                <WebSocketProvider>
                  <NextTopLoader
                    color="#FF8012"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px #FF8012,0 0 5px #FF8012"
                  />
                  {children}
                  <Toaster richColors position="top-right" />
                  <WebSocketDebugger />
                  <WebSocketConnectionMonitor />
                </WebSocketProvider>
              </AINotificationProvider>
            </LoadingProvider>
          </ColorModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 