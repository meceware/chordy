'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Guitar } from 'lucide-react';
import { SheetView } from '@/components/sheet-view';
import { ChordDialog } from '@/components/chord-dialog';
import { SongsDrawer } from '@/components/songs-drawer';
import { PlayMode } from '@/components/play-mode';
import { MetronomeDrawer } from '@/components/metronome-drawer';
import { SaveNotice } from '@/components/save-notice';
import { SongCard } from '@/components/song-card';
import { ChordGrid, ChordVisibility, MetronomeSettings, TextSize, Transpose } from '@/components/song-tools';
import { VideoTutorial } from '@/components/video-tutorial';
import { CollapsibleCard } from '@/components/collapsible-card';
import { siteConfig } from '@/components/config';
import { tokenizeSheet, sheetChords } from '@/lib/sheet/tokenize';
import { transposeSheet } from '@/lib/sheet/transpose';
import { saveBpm, saveMetronome, saveScrollSpeed, saveTranspose } from '@/app/songs/[id]/actions';
import { DEFAULT_BPM, DEFAULT_PRESET, PRESETS, isSilent, parsePattern, patternLabel, serialisePattern } from '@/lib/metronome';
import { initialSpeed } from '@/lib/scroll-speed';
import { useMetronome } from '@/lib/use-metronome';
import { useAutosave } from '@/lib/use-autosave';
import { useMediaQuery } from '@/lib/hooks';

// Every key is reachable within a tritone either way, so a wider range would only offer
// duplicate spellings of the same pitch.
const TRANSPOSE_LIMIT = 6;

/**
 * The song's chords as a card of their own, between the tutorial and the sheet, folded so the
 * sheet starts high. Folded, its title row still names every chord, in the order they come. Open,
 * it ends with somewhere to look a fingering up before drawing it here. That link sits under the
 * shapes rather than in the title row, which is all one button that folds the card.
 */
function ChordsCard({ chords, shapes, prefs, onOpen }) {
  const names = chords.length > 0 ? <span className="font-mono font-semibold text-chord">{chords.join('  ')}</span> : null;

  return (
    <CollapsibleCard icon={Guitar} title="Chords" summary={names}>
      <div className="space-y-3 p-4">
        <ChordGrid chords={chords} shapes={shapes} prefs={prefs} onOpen={onOpen} />
        <a
          href={siteConfig.links.reactChords}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Look up other fingerings on react-chords
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </CollapsibleCard>
  );
}

/**
 * The song page below the header: the sheet scrolls in one area, and the bars stay under it.
 *
 * Top to bottom: the song's card, with what is set once before playing — the key, the metronome,
 * the text size; the tutorial and the song's chords, both folded; then the sheet. What is used while
 * playing is in the play bar, and a chord tapped in the sheet opens its shapes.
 */
export function SongSheet({ song, shapes, prefs, songs }) {
  const narrow = useMediaQuery('(max-width: 639px)');
  const defaultFontSize = narrow ? 0.9375 : 1.0625;

  const [transpose, setTranspose] = useState(song.transpose);
  const [view, setView] = useState('all');
  const [fontSize, setFontSize] = useState(null);
  const [tempo, setTempo] = useState(song.bpm ?? DEFAULT_BPM);
  const [pattern, setPattern] = useState(() => parsePattern(song.metronome) ?? { ...PRESETS[DEFAULT_PRESET] });
  const [speed, setSpeed] = useState(() => initialSpeed(song.scrollSpeed));
  const [panel, setPanel] = useState(null);
  const [chord, setChord] = useState(null);
  const [stage, setStage] = useState(false);

  // The grid lives in a drawer and the transport in the play bar, so the engine belongs to
  // whatever contains both.
  const { running, toggle: toggleMetronome, playhead } = useMetronome(pattern, tempo);

  // Local state drives the render so every tap is instant; each write is coalesced so a run of
  // taps costs one round trip. None of these has a save button, so a failure has to be visible.
  const saves = [
    useAutosave(transpose, (value) => saveTranspose(song.id, value), { initial: song.transpose }),
    useAutosave(tempo, (value) => saveBpm(song.id, value), { initial: song.bpm ?? DEFAULT_BPM }),
    useAutosave(pattern, (value) => saveMetronome(song.id, serialisePattern(value)), { serialise: serialisePattern }),
    useAutosave(speed, (value) => saveScrollSpeed(song.id, value), { initial: initialSpeed(song.scrollSpeed) }),
  ];
  const failed = saves.some((save) => save.status === 'error');
  const retry = () => saves.filter((save) => save.status === 'error').forEach((save) => save.retry());

  const shift = useCallback(
    (delta) => setTranspose((current) => Math.min(TRANSPOSE_LIMIT, Math.max(-TRANSPOSE_LIMIT, current + delta))),
    [],
  );

  useEffect(() => {
    document.body.dataset.stage = String(stage);
    return () => {
      delete document.body.dataset.stage;
    };
  }, [stage]);

  // Stage mode decides, and fullscreen follows it. Fullscreen can be refused (iPhone Safari has
  // none), in which case the stage layout applies on its own.
  const toggleStage = useCallback(async () => {
    if (stage) {
      setStage(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      return;
    }
    setStage(true);
    await document.documentElement.requestFullscreen?.().catch(() => {});
  }, [stage]);

  // Fullscreen left by the browser's own means — Escape, a system gesture — leaves stage mode with
  // it, so the title, the header and the tools come back instead of staying hidden.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setStage(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // The list mirrors what is on screen, so a transposed song lists the chords you are
  // actually playing rather than the ones as written.
  const chords = useMemo(
    () => sheetChords(transposeSheet(tokenizeSheet(song.body), transpose)),
    [song.body, transpose],
  );

  // The sheet and the chord card open the same dialog.
  const openChord = setChord;
  const openPanel = (name) => setPanel((current) => (current === name ? null : name));
  const panelProps = (name) => ({ open: panel === name, onOpenChange: (open) => setPanel(open ? name : null) });

  const transposeControl = (
    <Transpose
      songKey={song.songKey}
      transpose={transpose}
      limit={TRANSPOSE_LIMIT}
      onBy={shift}
      onReset={() => setTranspose(0)}
    />
  );
  const metronomeControl = <MetronomeSettings label={patternLabel(pattern)} tempo={tempo} onOpen={() => setPanel('metronome')} />;
  const chordsControl = <ChordVisibility view={view} onView={setView} />;
  const sizeControl = (
    <TextSize fontSize={fontSize ?? defaultFontSize} defaultFontSize={defaultFontSize} onFontSize={setFontSize} />
  );

  return (
    <div data-song-page className="flex flex-1 flex-col">
      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10 lg:pt-6">
          <article className="min-w-0 space-y-5">
            <div className="hide-in-stage">
              <SongCard
                song={song}
                transpose={transpose}
                tempo={tempo}
                transposeControl={transposeControl}
                metronomeControl={metronomeControl}
                chordsControl={chordsControl}
                sizeControl={sizeControl}
              />
            </div>

            <VideoTutorial url={song.tutorialUrl} />

            <ChordsCard chords={chords} shapes={shapes} prefs={prefs} onOpen={openChord} />

            <SheetView
              body={song.body}
              transpose={transpose}
              showChords={view === 'all'}
              showLyrics
              fontSize={fontSize}
              onChord={openChord}
            />
          </article>
        </div>
      </div>

      <div className="no-print sticky bottom-0 z-30">
        <SaveNotice failed={failed} onRetry={retry} className="absolute inset-x-0 bottom-full mb-2 px-4" />

        <PlayMode
          speed={speed}
          onSpeed={setSpeed}
          onPanel={openPanel}
          onTransposeBy={shift}
          stage={stage}
          onToggleStage={toggleStage}
          metronomeRunning={running}
          metronomeSilent={isSilent(pattern)}
          onToggleMetronome={toggleMetronome}
        />
      </div>

      <SongsDrawer {...panelProps('songs')} songs={songs} currentId={song.id} />
      <ChordDialog chord={chord} onClose={() => setChord(null)} shapes={shapes} songId={song.id} prefs={prefs} />
      <MetronomeDrawer
        {...panelProps('metronome')}
        bpm={tempo}
        onBpm={setTempo}
        pattern={pattern}
        onPattern={setPattern}
        running={running}
        playhead={playhead}
        onToggle={toggleMetronome}
      />
    </div>
  );
}
