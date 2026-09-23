import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { ServiceWorker } from '@/components/service-worker';
import { siteConfig } from '@/components/config';
import { currentSession } from '@/lib/session';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: { default: siteConfig.title, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // Private and login-gated. Cloudflare Access already keeps crawlers out; this is the second
  // lock, for the day the app is reachable without it.
  robots: { index: false, follow: false, nocache: true },
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: 'default' },
  // Sheets are full of bare numbers — frets, capo positions, BPM — and iOS turns runs of them
  // into telephone links.
  formatDetection: { telephone: false, date: false, address: false, email: false },
};

export const viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: siteConfig.colors.light },
    { media: '(prefers-color-scheme: dark)', color: siteConfig.colors.dark },
  ],
};

export default async function RootLayout({ children }) {
  const session = await currentSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased`}
    >
      <body className="flex min-h-full w-full flex-col">
        <Providers>
          <Header email={session?.user?.email ?? null} />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
          <ServiceWorker />
        </Providers>
      </body>
    </html>
  );
}
