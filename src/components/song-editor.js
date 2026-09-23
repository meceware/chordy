'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Save, Trash2, Eye, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TagPicker } from '@/components/tag-picker';
import { SheetView } from '@/components/sheet-view';
import { saveSong, removeSong } from '@/app/songs/actions';
import { tokenizeSheet, unrecognisedCount } from '@/lib/sheet/tokenize';
import { keyInput } from '@/lib/song-key';

function Field({ label, className, ...props }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
      <Input {...props} />
    </label>
  );
}

export function SongEditor({ initial, allTags, converted, shapes, prefs }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [fields, setFields] = useState(() => ({
    title: initial.title ?? '',
    artist: initial.artist ?? '',
    songKey: initial.songKey ?? '',
    capo: initial.capo ?? '',
    bpm: initial.bpm ?? '',
    mediaUrl: initial.mediaUrl ?? '',
    tutorialUrl: initial.tutorialUrl ?? '',
  }));
  const [body, setBody] = useState(initial.body ?? '');
  const [tags, setTags] = useState(initial.tags ?? []);
  const [pane, setPane] = useState('edit');
  const [problem, setProblem] = useState(null);
  const [duplicate, setDuplicate] = useState(null);

  const unrecognised = useMemo(() => unrecognisedCount(tokenizeSheet(body)), [body]);
  const set = (name) => (event) => setFields((current) => ({ ...current, [name]: event.target.value }));

  const setKey = (event) =>
    setFields((current) => ({ ...current, songKey: keyInput(event.target.value) }));

  const submit = (force = false) => {
    setProblem(null);
    setDuplicate(null);

    startTransition(async () => {
      const result = await saveSong({ ...fields, id: initial.id, body, tags, force, sourceText: initial.sourceText, sourceFormat: initial.sourceFormat });

      if (result?.error) return setProblem(result.error);
      if (result?.duplicate) return setDuplicate(result.duplicate);

      router.push(`/songs/${result.id}`);
    });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {converted ? (
        <p className="flex items-start gap-2 rounded-md bg-sky-50 p-3 text-sm text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Converted from ChordPro. Check the spacing before saving — this is the only step
          that can change it.
        </p>
      ) : null}

      {problem ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{problem}</p>
      ) : null}

      {duplicate ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1">
            “{duplicate.title}”{duplicate.artist ? ` by ${duplicate.artist}` : ''} already exists.
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => submit(true)}>
            Save anyway
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" value={fields.title} onChange={set('title')} required className="sm:col-span-2" />
        <Field label="Artist" value={fields.artist} onChange={set('artist')} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Key" value={fields.songKey} onChange={setKey} placeholder="G" maxLength={3} />
          <Field label="Capo" value={fields.capo} onChange={set('capo')} inputMode="numeric" placeholder="2" />
          <Field label="BPM" value={fields.bpm} onChange={set('bpm')} inputMode="numeric" placeholder="90" />
        </div>
        <Field label="Listen link" value={fields.mediaUrl} onChange={set('mediaUrl')} placeholder="https://" />
        <Field label="Tutorial link" value={fields.tutorialUrl} onChange={set('tutorialUrl')} placeholder="https://" />
      </div>

      <div>
        <span className="mb-1 block text-xs tracking-wide text-muted-foreground uppercase">Tags</span>
        <TagPicker selected={tags} options={allTags} onChange={setTags} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">Sheet</span>

        <div className="flex items-center gap-2">
          {unrecognised > 0 ? (
            <Badge variant="outline" className="text-amber-700 dark:text-amber-300">
              {unrecognised} chord{unrecognised === 1 ? '' : 's'} not recognised
            </Badge>
          ) : null}

          <ToggleGroup
            type="single"
            value={pane}
            onValueChange={(next) => next && setPane(next)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="edit">
              <PencilLine className="size-4" />
              Edit
            </ToggleGroupItem>
            <ToggleGroupItem value="preview">
              <Eye className="size-4" />
              Preview
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          spellCheck={false}
          wrap="off"
          aria-label="Sheet source"
          className={[
            'h-[60vh] w-full resize-y rounded-md border border-input bg-background p-3',
            'font-mono text-[0.8125rem] leading-relaxed whitespace-pre',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            pane === 'edit' ? 'block' : 'hidden',
          ].join(' ')}
        />

        <div
          className={[
            'h-[60vh] overflow-auto rounded-md border border-border bg-card p-3',
            pane === 'preview' ? 'block' : 'hidden',
          ].join(' ')}
        >
          <SheetView body={body} wrap={false} fontSize={0.8125} shapes={shapes} songId={initial.id} prefs={prefs} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? 'Saving…' : 'Save'}
        </Button>

        {initial.id ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-destructive">
                <Trash2 className="size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{fields.title || 'this song'}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  The sheet and its tags are removed for good. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => startTransition(() => removeSong(initial.id))}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </form>
  );
}
