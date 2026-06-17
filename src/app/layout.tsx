import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';

import { Footer } from '@/components/layout/Footer';
import { HeaderWrapper } from '@/components/layout/HeaderWrapper';
import { SiteBodyTopCode, SiteHeadCode } from '@/components/site/SiteCustomCode';
import { LoginPromptModalHost } from '@/components/ui/LoginPromptModalHost';
import { LoginPromptProvider } from '@/contexts/LoginPromptContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { getLocale } from '@/lib/locale';
import { getSiteSettings } from '@/lib/site-settings';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://freehub.kr';

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(appUrl),
    icons: {
      icon: '/Freehub_Fabicon.ico',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const settings = await getSiteSettings();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <SiteHeadCode html={settings.extraHeadHtml} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        <SiteBodyTopCode html={settings.extraBodyHtml} />
        <SiteSettingsProvider settings={settings}>
          <LocaleProvider initialLocale={locale}>
            <LoginPromptProvider>
              <FavoritesProvider>
                <HeaderWrapper />
                <main className="flex-1">{children}</main>
                <Footer />
                <LoginPromptModalHost />
              </FavoritesProvider>
            </LoginPromptProvider>
          </LocaleProvider>
        </SiteSettingsProvider>

        {settings.adsEnabled && settings.adsensePublisherId && (
          <Script
            id="adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsensePublisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
