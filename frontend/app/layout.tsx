import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Story Library',
    template: '%s | Story Library',
  },
  description: 'A multilingual story collection platform for language learning',
  keywords: ['stories', 'language learning', 'turkish', 'english', 'reading'],
  authors: [{ name: 'Story Library Team' }],
  creator: 'Story Library',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'Story Library',
    description: 'A multilingual story collection platform for language learning',
    siteName: 'Story Library',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Story Library',
    description: 'A multilingual story collection platform for language learning',
    creator: '@storylibrary',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background font-sans antialiased')}>
        <ErrorBoundary>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              {children}
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}