import { Guitar, Lightbulb, Lock, Metronome, MoveVertical, Music2 } from 'lucide-react';
import { LandingDemo } from '@/components/landing-demo';
import { Page } from '@/components/page';
import { SiteFooter } from '@/components/site-footer';
import { SignInDialog } from '@/components/signin-dialog';
import { siteConfig } from '@/components/config';

const FEATURES = [
  { icon: Music2, title: 'Transpose in one tap', body: 'Every chord follows, and the song remembers the key.' },
  { icon: Guitar, title: 'Every chord, drawn', body: 'Tap a chord for its fingerings, pin the one you play, or draw your own.' },
  { icon: MoveVertical, title: 'Hands-free scrolling', body: 'The page moves at your pace while both hands are on the guitar.' },
  { icon: Metronome, title: 'A metronome with feel', body: 'One tap to start. From a plain click to bossa nova and swing.' },
  { icon: Lightbulb, title: 'Screen stays on', body: 'Work on one passage without the phone going dark.' },
  { icon: Lock, title: 'Yours, on your server', body: 'One container, one file. Sign in with a code, no passwords.' },
];

/**
 * What a signed-out visitor sees at `/`: what Chordy is, a sign-in button that opens the form
 * over the page, and a sheet you can transpose. Public — nothing here reads the database.
 */
export function Landing({ linkFailed = false }) {
  return (
    // At least a screen tall, so the footer sits at the bottom of the window however little
    // there is above it; on a tall screen the gap goes above the footer, not below it.
    <div className="flex flex-1 flex-col">
    <Page className="flex-1 space-y-14 pt-8 sm:space-y-20 sm:pt-14">
      {/* One column at every width: the pitch and the way in first, then the sheet to try. */}
      <section className="space-y-10">
        <div className="space-y-6">
          <h1 className="text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl">
            Your chord sheets, ready to play.
          </h1>

          <p className="max-w-prose text-lg text-pretty text-muted-foreground">
            {siteConfig.name} keeps your songs in one place: transpose any sheet, see how every chord is fingered, and
            let the page scroll while you play.
          </p>

          <SignInDialog linkFailed={linkFailed} />
        </div>

        <LandingDemo />
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Built for the music stand</h2>
        <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-brand">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-pretty text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

    </Page>

    <SiteFooter />
    </div>
  );
}
