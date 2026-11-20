import { siteConfig } from '@/components/config';

const icon = (name) => `/icons/${name}?v=${siteConfig.iconVersion}`;

export default function manifest() {
  return {
    id: '/',
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: siteConfig.colors.dark,
    theme_color: siteConfig.colors.dark,
    categories: ['music', 'productivity'],
    icons: [
      { src: icon('icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon('icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon('icon-maskable-192.png'), sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: icon('icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [{ name: 'Add a song', url: '/songs/new' }],
  };
}
