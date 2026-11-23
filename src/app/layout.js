import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { ServiceWorker } from '@/components/service-worker';
import { RefreshOnReturn } from '@/components/refresh-on-return';
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

/**
 * Umami's tracker, only when both settings are there (`.env.example`). Read per request rather
 * than at build, so turning it on or off is an `.env` change and a restart. `data-domains` keeps
 * it to the site's own address, so a development copy never counts as a visit.
 */
function VisitCounter() {
  const src = process.env.UMAMI_SCRIPT_URL;
  const id = process.env.UMAMI_WEBSITE_ID;
  if (!src || !id) return null;

  let domain;
  try {
    domain = new URL(siteConfig.url).hostname;
  } catch {
    domain = undefined;
  }

  return <script defer src={src} data-website-id={id} data-domains={domain} />;
}

export default async function RootLayout({ children }) {
  const session = await currentSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} w-full antialiased`}
    >
      {/* A normal page: the window scrolls. At least the window's height, so a short page still
          puts its footer (or the song's play bar) at the bottom. */}
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <RefreshOnReturn />
          <Header email={session?.user?.email ?? null} />
          <main className="flex w-full flex-1 flex-col">
            {children}
          </main>
          <ServiceWorker />
        </Providers>
        <VisitCounter />
      </body>
    </html>
  );
}
