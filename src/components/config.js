export const siteConfig = {
  name: 'Chordy',
  title: 'Chordy - Your Own Guitar Chords',
  description: 'Store your guitar chords and access them anywhere.',
  url: process.env.SITE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  from: 'Chordy',
  // Shared by the auth config and the proxy's cookie check; they must agree.
  cookiePrefix: 'chordy',
  // Shared by the auth config and the sign-in form: how long an emailed code works, and how soon
  // another email may be asked for.
  signIn: { codeSeconds: 20 * 60, resendSeconds: 90 },
  // Hex mirrors of --primary and --background in globals.css, for the places that cannot read
  // CSS: the generated icons, the manifest, and the theme-color meta tags.
  colors: { brand: '#fbbf24', light: '#fafaf9', dark: '#0c0c0d' },
  // Bump after `npm run icons`. The manifest asks for `/icons/…?v=<this>`, so an installed app sees
  // new icon addresses and fetches them, rather than keeping the copies it has cached.
  iconVersion: 1,
  links: {
    reactChords: 'https://tombatossals.github.io/react-chords/',
    github: 'https://github.com/meceware/chordy',
  },
};
