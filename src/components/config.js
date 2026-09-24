export const siteConfig = {
  name: 'Chordy',
  title: 'Chordy - Your Own Guitar Chords',
  description: 'Store your guitar chords and access them anywhere.',
  url: process.env.SITE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  from: 'Chordy',
  // Shared by the auth config and the proxy's cookie check; they must agree.
  cookiePrefix: 'chordy',
  // Hex mirrors of --primary and --background in globals.css, for the places that cannot read
  // CSS: the generated icons, the manifest, and the theme-color meta tags.
  colors: { brand: '#5959e8', light: '#fcfdfe', dark: '#0d1017' },
  links: {
    reactChords: 'https://tombatossals.github.io/react-chords/',
  },
};
