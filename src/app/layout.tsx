import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';

import { Footer } from '@/components/layout/Footer';
import { HeaderWrapper } from '@/components/layout/HeaderWrapper';
import { LoginPromptModalHost } from '@/components/ui/LoginPromptModalHost';
import { LoginPromptProvider } from '@/contexts/LoginPromptContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { getLocale, getTranslations } from '@/lib/locale';
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
  const locale = await getLocale();
  const t = await getTranslations();
  const settings = await getSiteSettings();

  const defaultTitle =
    (locale === 'en' ? settings.metaTitleEn : settings.metaTitleKo) ||
    t('metadata.defaultTitle', { appName: settings.siteName });
  const defaultDescription =
    (locale === 'en'
      ? settings.metaDescriptionEn
      : settings.metaDescriptionKo) || t('metadata.defaultDescription');
  const ogTitle =
    (locale === 'en' ? settings.ogTitleEn : settings.ogTitleKo) || defaultTitle;
  const ogDescription =
    (locale === 'en' ? settings.ogDescriptionEn : settings.ogDescriptionKo) ||
    t('metadata.ogDescription');

  const verification: Metadata['verification'] = {};
  if (settings.googleSiteVerification) {
    verification.google = settings.googleSiteVerification;
  }
  if (settings.naverSiteVerification) {
    verification.other = {
      'naver-site-verification': settings.naverSiteVerification,
    };
  }
  if (settings.bingSiteVerification) {
    verification.other = {
      ...(verification.other ?? {}),
      'msvalidate.01': settings.bingSiteVerification,
    };
  }

  return {
    title: {
      default: defaultTitle,
      template: `%s | ${settings.siteName}`,
    },
    description: defaultDescription,
    metadataBase: new URL(appUrl),
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'ko_KR',
      siteName: settings.siteName,
      title: ogTitle,
      description: ogDescription,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: Object.keys(verification).length > 0 ? verification : undefined,
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
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        <SiteSettingsProvider settings={settings}>
          <LocaleProvider initialLocale={locale}>
            <LoginPromptProvider>
              <HeaderWrapper />
              <main className="flex-1">{children}</main>
              <Footer />
              <LoginPromptModalHost />
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

        {settings.gaMeasurementId && (
          <>
            <Script
              id="ga-script"
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.gaMeasurementId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
