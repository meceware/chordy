'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SheetControls } from '@/components/sheet-controls';
import { SheetView } from '@/components/sheet-view';
import { ChordsInSong } from '@/components/chords-in-song';
import { PlayMode } from '@/components/play-mode';
import { MetronomeEditor } from '@/components/metronome-editor';
import { tokenizeSheet, sheetChords } from '@/lib/sheet/tokenize';
import { transposeSheet } from '@/lib/sheet/transpose';
import { saveBpm, saveMetronome, saveTranspose } from '@/app/songs/[id]/actions';
import { DEFAULT_BPM, DEFAULT_PRESET, PRESETS, parsePattern, serialisePattern } from '@/lib/metronome';
import { useMetronome } from '@/lib/use-metronome';
import { useMediaQuery } from '@/lib/hooks';

// Every key is reachable within a tritone either way, so a wider range would only offer
// duplicate spellings of the same pitch.
const TRANSPOSE_LIMIT = 6;

export function SongSheet({ song, shapes, prefs, neighbours }) {
  const narrow = useMediaQuery('(max-width: 639px)');

  const [transpose, setTranspose] = useState(song.transpose);
  const [view, setView] = useState('all');
  const [wrap, setWrap] = useState(true);
  const [fontSize, setFontSize] = useState(null);
  const [tempo, setTempo] = useState(song.bpm ?? DEFAULT_BPM);
  const [pattern, setPattern] = useState(() => parsePattern(song.metronome) ?? { ...PRESETS[DEFAULT_PRESET] });

  // The grid is up here in the page and the transport is down in the play bar, so the engine
  // belongs to whatever contains both.
  const { running, toggle: toggleMetronome, playhead } = useMetronome(pattern, tempo);

  // Local state drives the render so stepping is instant; the write is coalesced so a
  // run of clicks costs one round trip instead of one per semitone.
  const pending = useRef(song.transpose);
  useEffect(() => {
    if (transpose === pending.current) return;

    const timer = setTimeout(() => {
      pending.current = transpose;
      saveTranspose(song.id, transpose);
    }, 400);
    return () => clearTimeout(timer);
  }, [song.id, transpose]);

  const storedTempo = useRef(song.bpm ?? DEFAULT_BPM);
  useEffect(() => {
    if (tempo === storedTempo.current) return;

    const timer = setTimeout(() => {
      storedTempo.current = tempo;
      saveBpm(song.id, tempo);
    }, 400);
    return () => clearTimeout(timer);
  }, [song.id, tempo]);

  // Edits arrive as updaters, so two cells toggled in the same tick both survive; the write is
  // then coalesced off the resulting pattern rather than fired per click.
  const storedPattern = useRef(serialisePattern(pattern));
  useEffect(() => {
    const serialised = serialisePattern(pattern);
    if (serialised === storedPattern.current) return;

    const timer = setTimeout(() => {
      storedPattern.current = serialised;
      saveMetronome(song.id, serialised);
    }, 400);
    return () => clearTimeout(timer);
  }, [song.id, pattern]);

  // The list mirrors what is on screen, so a transposed song lists the chords you are
  // actually playing rather than the ones as written.
  const shift = (delta) =>
    setTranspose((current) => Math.min(TRANSPOSE_LIMIT, Math.max(-TRANSPOSE_LIMIT, current + delta)));

  const chords = useMemo(
    () => sheetChords(transposeSheet(tokenizeSheet(song.body), transpose)),
    [song.body, transpose],
  );

  return (
    <div className="space-y-4">
      <SheetControls
        songKey={song.songKey}
        transpose={transpose}
        transposeLimit={TRANSPOSE_LIMIT}
        onTransposeBy={shift}
        onTransposeReset={() => setTranspose(0)}
        view={view}
        onView={setView}
        wrap={wrap}
        onWrap={setWrap}
        fontSize={fontSize ?? (narrow ? 0.8125 : 1)}
        onFontSize={setFontSize}
      />

      <ChordsInSong chords={chords} shapes={shapes} songId={song.id} prefs={prefs} />

      <MetronomeEditor
        bpm={tempo}
        onBpm={setTempo}
        pattern={pattern}
        onPattern={setPattern}
        running={running}
        playhead={playhead}
        onToggle={toggleMetronome}
      />

      <SheetView
        body={song.body}
        transpose={transpose}
        showChords={view === 'all'}
        showLyrics
        wrap={wrap}
        fontSize={fontSize}
        shapes={shapes}
        songId={song.id}
        prefs={prefs}
      />

      <PlayMode
        songId={song.id}
        onTransposeBy={shift}
        previous={neighbours?.previous}
        next={neighbours?.next}
        bpm={song.bpm}
        scrollSpeed={song.scrollSpeed}
        metronomeRunning={running}
        onToggleMetronome={toggleMetronome}
      />
    </div>
  );
}
