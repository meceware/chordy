import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SongImport } from '@/components/song-import';
import { requireUserId } from '@/lib/session';
import { listTags } from '@/lib/songs';
import { chordShapeLibrary } from '@/lib/chord-shapes';

export const metadata = { title: 'Add a song' };

export const dynamic = 'force-dynamic';

export default async function NewSongPage() {
  const userId = await requireUserId();

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All songs
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Import a sheet</h1>

      <SongImport allTags={listTags(userId)} shapes={chordShapeLibrary(userId)} />
    </div>
  );
}
