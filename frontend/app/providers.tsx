'use client';

import { PushUniversalWalletProvider, PushUI } from '@pushchain/ui-kit';
import { ThemeProvider } from 'next-themes';
import { APP_CONFIG } from '@/config/constants';
import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

function PushWalletWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <PushUniversalWalletProvider
      config={{
        uid: 'pushfund',
        network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET_DONUT,
        login: {
          wallet: {
            enabled: true,
          },
          email: true,
          google: true,
        },
      }}
      app={{
        title: APP_CONFIG.name,
        description: APP_CONFIG.description,
      }}
      themeMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      themeOverrides={{
        // Match exact primary color from globals.css
        '--pw-core-brand-primary-color': '#ff00c8',
        '--pwauth-btn-connect-bg-color': '#ff00c8',
        '--pwauth-btn-connect-text-color': '#ffffff',
        '--pwauth-btn-connected-bg-color': '#ff00c8',
        '--pwauth-btn-connected-text-color': '#ffffff',
        '--pwauth-btn-connect-border-radius': '0.5rem',
        light: {
          '--pw-core-brand-primary-color': '#ff00c8',
          '--pwauth-btn-connect-bg-color': '#ff00c8',
          '--pwauth-btn-connect-text-color': '#ffffff',
          '--pwauth-btn-connected-bg-color': '#ff00c8',
          '--pwauth-btn-connected-text-color': '#ffffff',
        },
        dark: {
          '--pw-core-brand-primary-color': '#ff00c8',
          '--pwauth-btn-connect-bg-color': '#ff00c8',
          '--pwauth-btn-connect-text-color': '#ffffff',
          '--pwauth-btn-connected-bg-color': '#ff00c8',
          '--pwauth-btn-connected-text-color': '#ffffff',
        },
      }}
    >
      {children}
      <Toaster position="bottom-right" richColors />
    </PushUniversalWalletProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PushWalletWrapper>
        {children}
      </PushWalletWrapper>
    </ThemeProvider>
  );
}
