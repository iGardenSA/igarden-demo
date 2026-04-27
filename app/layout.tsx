import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'iGarden Smart OS — ازرع بذكاء',
  description: 'الديمو التفاعلي لنظام iGarden Smart OS — لوحة تحكم زراعية ذكية مع محرّك توصيات لـ 12 محصول × 4 مناطق سعودية. القراءات محاكاة.',
  keywords: ['iGarden', 'الزراعة الذكية', 'IoT', 'هيدروبونيك', 'Smart Agriculture', 'السعودية', 'ازرع بذكاء'],
  authors: [{ name: 'iGarden', url: 'https://igarden.sa' }],
  metadataBase: new URL('https://demo.igarden.sa'),
  openGraph: {
    title: 'iGarden Smart OS — ازرع بذكاء',
    description: 'الديمو التفاعلي لنظام التحكم الزراعي الذكي iGarden — مكتبة 12 محصول × 4 مناطق سعودية.',
    url: 'https://demo.igarden.sa',
    siteName: 'iGarden Smart OS Demo',
    locale: 'ar_SA',
    type: 'website',
    images: [
      {
        url: '/branding/icon-master-original.png',
        width: 192,
        height: 192,
        alt: 'iGarden Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'iGarden Smart OS — ازرع بذكاء',
    description: 'الديمو التفاعلي لنظام iGarden Smart OS',
    images: ['/branding/icon-master-original.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  icons: {
    icon: '/branding/icon-master-original.png',
    apple: '/branding/icon-master-original.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  themeColor: '#0F3D2E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
