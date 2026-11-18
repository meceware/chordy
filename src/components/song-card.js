import { BackLink } from '@/components/back-link';
import { SongActions } from '@/components/song-actions';
import { TagPills } from '@/components/tag-pills';
import { artistOf } from '@/lib/display';
import { transposeName } from '@/lib/chords/parse';

/**
 * What a song is, and how it will be played, set before you start. Who and what at the top; what
 * you can do to the song in the middle; and along the bottom the settings you touch once — the
 * key and the metronome, then how the sheet reads. Paper gets the title and a line of facts,
 * without the controls.
 *
 * The controls are the sheet's own, so the card and the sheet never disagree.
 */
export function SongCard({ song, transpose, tempo, transposeControl, metronomeControl, chordsControl, sizeControl }) {
  const facts = [
    song.capo ? (
      <>
        Capo <b className="font-semibold text-foreground">{song.capo}</b>
      </>
    ) : null,
    song.bpm ? (
      <>
        <b className="font-semibold text-foreground tabular-nums">{tempo}</b> bpm
      </>
    ) : null,
  ].filter(Boolean);

  // The music first, then how the sheet reads: on a phone that is a row each.
  const settings = [
    { label: song.songKey ? 'Key' : 'Transpose', control: transposeControl },
    { label: 'Metronome', control: metronomeControl },
    { label: 'Chords', control: chordsControl },
    { label: 'Text size', control: sizeControl },
  ];

  return (
    <header className="space-y-2">
      <BackLink href="/" label="Songs" className="no-print" />

      <div className="overflow-hidden rounded-xl border border-border bg-card print:border-0">
        <div className="px-3 pt-6 pb-4 text-center sm:px-6 print:p-0 print:text-left">
          {/* The title gets a line to itself; it is the one thing on the page that must never truncate. */}
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance">{song.title}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{artistOf(song)}</p>

          {facts.length > 0 || song.songKey ? (
            // Spaced as items rather than run together as a sentence, each fact with room around it.
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-sm text-muted-foreground print:justify-start">
              {/* The key is a control below; only paper, which has no controls, needs it in words. */}
              {song.songKey ? (
                <span className="hidden print:inline">
                  Key <b className="font-semibold">{transposeName(song.songKey, transpose)}</b>
                </span>
              ) : null}
              {facts.map((fact, index) => (
                <span key={index} className="contents">
                  {index > 0 ? (
                    <span aria-hidden className="text-muted-foreground/60">
                      ·
                    </span>
                  ) : null}
                  <span>{fact}</span>
                </span>
              ))}
            </p>
          ) : null}

          <TagPills tags={song.tags} className="mt-3 justify-center print:justify-start" />

          <SongActions
            songId={song.id}
            title={song.title}
            favourite={song.favourite}
            mediaUrl={song.mediaUrl}
            className="mt-4 flex-wrap justify-center"
          />
        </div>

        {/* Hairlines between cells come from the gap showing the border colour behind them. One row
            where there is room, two by two on a phone. */}
        <dl className="no-print grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
          {settings.map(({ label, control }) => (
            <div key={label} className="flex flex-col items-center justify-center gap-2 bg-secondary/40 px-3 py-3">
              <dt className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</dt>
              <dd className="flex items-center">{control}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
