import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import './jdv-theme.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { JDVProvider } from '@/contexts/JDVContext';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import StudioQuickControls from '@/components/theme/StudioQuickControls';
import StudioDesignRuntime from '@/components/theme/StudioDesignRuntime';
import ResponsiveMobileNavigation from '@/components/navigation/ResponsiveMobileNavigation';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'JDV Global Center — Votre Écosystème Numérique International',
  description:
    'JDV Global Center regroupe services financiers, commerciaux, professionnels et sociaux dans un écosystème numérique international pour individus et organisations.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AuthProvider>
          <JDVProvider>
            <ThemeProvider>
              {children}
              <ResponsiveMobileNavigation />
              <StudioDesignRuntime />
              <StudioQuickControls />
            </ThemeProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-sans)',
                },
              }}
            />
          </JDVProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
