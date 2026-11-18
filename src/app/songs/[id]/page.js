import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { SongSheet } from '@/components/song-sheet';
import { currentUserId, requireUserId } from '@/lib/session';
import { getSong, listSongs, recordView } from '@/lib/songs';
import { chordShapeLibrary } from '@/lib/chord-shapes';
import { chordPrefs } from '@/lib/chord-prefs';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const userId = await currentUserId();
  const song = userId && getSong(userId, id);

  if (!song) return { title: 'Song' };
  return { title: song.artist ? `${song.title} — ${song.artist}` : song.title };
}

export default async function SongPage({ params }) {
  const { id } = await params;
  const userId = await requireUserId();
  const song = getSong(userId, id);

  if (!song) notFound();

  // Recording the visit after the response keeps it off the render path entirely.
  after(() => recordView(userId, song.id));

  // Title order, the sequence the songs drawer steps through.
  const songs = listSongs(userId);

  return (
    <SongSheet song={song} shapes={chordShapeLibrary(userId)} prefs={chordPrefs(song.id)} songs={songs} />
  );
}
