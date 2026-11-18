import { SongImport } from '@/components/song-import';
import { requireUserId } from '@/lib/session';
import { listTags } from '@/lib/songs';
import { chordShapeLibrary } from '@/lib/chord-shapes';

export const metadata = { title: 'Add a song' };

export const dynamic = 'force-dynamic';

export default async function NewSongPage() {
  const userId = await requireUserId();

  return <SongImport allTags={listTags(userId)} shapes={chordShapeLibrary(userId)} />;
}
