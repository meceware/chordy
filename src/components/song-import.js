'use client';

import { useState } from 'react';
import { ArrowRight, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackLink, PageBar } from '@/components/back-link';
import { Page } from '@/components/page';
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

  const pasteFromClipboard = async () => {
    try {
      setPaste(await navigator.clipboard.readText());
    } catch {
      // Refused or unsupported; the box still takes a long-press paste.
    }
  };

  return (
    <>
      <Page className="space-y-4 pt-0">
        <PageBar>
          <BackLink href="/" label="Songs" className="mr-auto" />
          <Button type="button" className="h-10 rounded-xl px-5" onClick={handle} disabled={paste.trim() === ''}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </PageBar>

        <div className="space-y-1">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Add a song</h1>
          <p className="text-muted-foreground">
            Paste a chord sheet from anywhere. Chords over lyrics and ChordPro both work, and you check the result
            before anything is saved.
          </p>
        </div>

        <div className="relative">
          <textarea
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            aria-label="Pasted chord sheet"
            placeholder={'[Verse 1]\nG                  D\nSomewhere over the rainbow'}
            className="block h-[65dvh] min-h-96 w-full resize-y rounded-xl border border-input bg-card p-4 font-mono text-base whitespace-pre placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-[0.9375rem]"
          />
          {paste === '' ? (
            <Button
              type="button"
              variant="outline"
              className="absolute right-3 bottom-3 h-11 rounded-xl"
              onClick={pasteFromClipboard}
            >
              <ClipboardPaste className="size-4" />
              Paste
            </Button>
          ) : null}
        </div>
      </Page>
    </>
  );
}
