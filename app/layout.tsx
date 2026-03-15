import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Brospify Hub',
  description: 'Exklusive Community-Plattform',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Brospify' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-pt-16">
      <body className={`${inter.className} bg-[var(--color-bg)] text-[var(--color-text)] antialiased min-h-[100dvh] safe-area-padding`}>
        {children}
      </body>
    </html>
  );
}
