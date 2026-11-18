import { notFound } from 'next/navigation';
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
    <SongEditor initial={song} allTags={listTags(userId)} shapes={chordShapeLibrary(userId)} prefs={chordPrefs(song.id)} />
  );
}
