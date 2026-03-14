import type { Metadata } from 'next';
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-pt-16">
      <body className={`${inter.className} bg-[var(--color-bg)] text-[var(--color-text)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
