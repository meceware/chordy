import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SongEditor } from '@/components/song-editor';
import { requireUserId } from '@/lib/session';
import { getSong, listTags } from '@/lib/songs';
import { chordShapeLibrary } from '@/lib/chord-shapes';
import { chordPrefs } from '@/lib/chord-prefs';

export const metadata = { title: 'Edit' };

export const dynamic = 'force-dynamic';

export default async function EditSongPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const song = getSong(userId, id);

  if (!song) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/songs/${song.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {song.title}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Edit sheet</h1>

      <SongEditor initial={song} allTags={listTags(userId)} shapes={chordShapeLibrary(userId)} prefs={chordPrefs(song.id)} />
    </div>
  );
}
