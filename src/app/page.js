import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SongList } from '@/components/song-list';
import { InstallHint } from '@/components/install-hint';
import { Landing } from '@/components/landing';
import { Page } from '@/components/page';
import { SiteFooter } from '@/components/site-footer';
import { currentUserId } from '@/lib/session';
import { listSongs } from '@/lib/songs';

// Per-user, or the public landing page for nobody: there is nothing to prerender either way.
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const userId = await currentUserId();
  // A sign-in link that no longer works comes back here with `?error=`.
  if (!userId) return <Landing linkFailed={Boolean((await searchParams).error)} />;

  const songs = listSongs(userId);

  return (
    // At least a screen tall, so the footer sits at the bottom of a short library.
    <div className="flex flex-1 flex-col">
      <Page className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Songs</h1>
          <Button asChild size="icon" className="ml-auto size-11 rounded-xl" aria-label="Add a song">
            <Link href="/songs/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        </div>

        <InstallHint />

        <SongList songs={songs} />
      </Page>
      <SiteFooter />
    </div>
  );
}
