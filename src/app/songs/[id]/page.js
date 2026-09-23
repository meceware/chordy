import Link from 'next/link';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { ArrowLeft, Gauge, ExternalLink, Headphones, ClefTreble, Guitar, PencilLine, Download } from 'lucide-react';
import { SongSheet } from '@/components/song-sheet';
import { VideoTutorial } from '@/components/video-tutorial';
import { TagBadges } from '@/components/tag-badges';
import { artistOf } from '@/lib/display';
import { FavouriteButton } from '@/components/favourite-button';
import { Button } from '@/components/ui/button';
import { currentUserId, requireUserId } from '@/lib/session';
import { getSong, recordView, songNeighbours } from '@/lib/songs';
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

  return (
    <article className="space-y-5 pb-16">
      <Link
        href="/"
        className="no-print hide-in-stage inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All songs
      </Link>

      <header className="hide-in-stage space-y-2">
        <div className="flex items-start gap-2">
          <h1 className="flex-1 text-2xl font-semibold tracking-tight">{song.title}</h1>
          <FavouriteButton songId={song.id} favourite={song.favourite} />
          <Button asChild variant="ghost" size="icon" className="no-print size-8" aria-label="Download as Markdown">
            <a href={`/songs/${song.id}/export`}>
              <Download className="size-4" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="no-print size-8" aria-label="Edit sheet">
            <Link href={`/songs/${song.id}/edit`}>
              <PencilLine className="size-4" />
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground">{artistOf(song)}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {song.songKey ? (
            <span className="flex items-center gap-1.5 font-mono font-semibold text-primary" title="Key">
              <ClefTreble className="size-4" />
              {song.songKey}
            </span>
          ) : null}

          {song.capo ? (
            <span className="flex items-center gap-1.5 text-muted-foreground" title="Capo">
              <Guitar className="size-4 text-violet-500" />
              Capo <span className="font-mono font-semibold text-primary">{song.capo}</span>
            </span>
          ) : null}

          {song.bpm ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Gauge className="size-4 text-emerald-500" />
              {song.bpm} bpm
            </span>
          ) : null}

          {song.mediaUrl ? (
            <a
              href={song.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-print flex items-center gap-1.5 text-primary hover:underline"
            >
              <Headphones className="size-4" />
              Listen
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </div>

        <TagBadges tags={song.tags} />
      </header>

      <SongSheet
        song={song}
        shapes={chordShapeLibrary(userId)}
        prefs={chordPrefs(song.id)}
        neighbours={songNeighbours(userId, song.id)}
      />

      <VideoTutorial url={song.tutorialUrl} />
    </article>
  );
}
