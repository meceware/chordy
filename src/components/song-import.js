'use client';

import { useState } from 'react';
import { ArrowRight, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SongEditor } from '@/components/song-editor';
import { detectFormat } from '@/lib/sheet/detect';
import { chordproToText } from '@/lib/sheet/chordpro-to-text';

// A run of tabs becomes spaces once, here, so the editor shows exactly what will be
// stored. Eight columns is the conventional tab stop for chord sheets.
function expandTabs(text) {
  return text
    .split('\n')
    .map((line) => {
      let out = '';
      for (const char of line) {
        if (char === '\t') out = out.padEnd(out.length + (8 - (out.length % 8)));
        else out += char;
      }
      return out;
    })
    .join('\n');
}

export function SongImport({ allTags, shapes }) {
  const [paste, setPaste] = useState('');
  const [imported, setImported] = useState(null);

  if (imported) {
    return <SongEditor initial={imported.initial} allTags={allTags} converted={imported.converted} shapes={shapes} />;
  }

  const handle = () => {
    const source = paste.replace(/\r\n?/g, '\n');
    const format = detectFormat(source);
    const expanded = expandTabs(source);

    const { body, meta } = format === 'chordpro' ? chordproToText(expanded) : { body: expanded, meta: {} };

    setImported({
      converted: format === 'chordpro',
      initial: {
        ...meta,
        body,
        sourceText: source,
        sourceFormat: format,
        tags: [],
      },
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Paste a chord sheet. Chords-over-lyrics and ChordPro are both accepted — the format
        is detected, and you get to check the result before it is saved.
      </p>

      <textarea
        value={paste}
        onChange={(event) => setPaste(event.target.value)}
        spellCheck={false}
        wrap="off"
        aria-label="Pasted chord sheet"
        placeholder={'[Verse 1]\nG                  D\nSomewhere over the rainbow'}
        className="h-[55vh] w-full resize-y rounded-md border border-input bg-background p-3 font-mono text-[0.8125rem] whitespace-pre focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />

      <Button type="button" onClick={handle} disabled={paste.trim() === ''}>
        <ClipboardPaste className="size-4" />
        Continue
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
