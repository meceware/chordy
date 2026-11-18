'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, CloudOff, LoaderCircle, RotateCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackLink, PageBar } from '@/components/back-link';
import { Page } from '@/components/page';
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
import { keyInput, normaliseKey } from '@/lib/song-key';
import { useAutosave } from '@/lib/use-autosave';
import { cn } from '@/lib/utils';

function Field({ label, hint, error, className, ...props }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="block text-sm font-medium">{label}</span>
      <Input aria-invalid={error ? true : undefined} className="h-11 rounded-xl bg-card" {...props} />
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function SaveState({ status, invalid, onRetry }) {
  if (invalid) return <span className="px-2 text-sm text-destructive">Not saved</span>;

  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Saving
      </span>
    );
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm text-destructive hover:bg-accent"
      >
        <CloudOff className="size-4" />
        Retry
        <RotateCw className="size-3.5" />
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
      <Check className="size-4" />
      Saved
    </span>
  );
}

const serialise = (draft) => JSON.stringify(draft);

/**
 * Editing an existing song has no save button: every change is written a moment after you stop
 * typing, and leaving the page sends anything still waiting. A new song is created once, on
 * purpose, so a half-pasted sheet never turns into a stray song; from then on it autosaves too.
 */
export function SongEditor({ initial, allTags, converted, shapes, prefs }) {
  const router = useRouter();
  const editing = Boolean(initial.id);
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
  const setKey = (event) => setFields((current) => ({ ...current, songKey: keyInput(event.target.value) }));

  const errors = {
    title: fields.title.trim() === '' ? 'A song needs a title.' : null,
    body: body.trim() === '' ? 'The sheet is empty.' : null,
    songKey: normaliseKey(fields.songKey) === null ? 'A note from A to G, then # or b, then m for minor.' : null,
  };
  const invalid = Object.values(errors).some(Boolean);

  const draft = { ...fields, body, tags };
  const payload = (value, force) => ({
    ...value,
    id: initial.id,
    force,
    sourceText: initial.sourceText,
    sourceFormat: initial.sourceFormat,
  });

  const autosave = useAutosave(
    draft,
    async (value) => {
      const result = await saveSong(payload(value, true));
      if (!result?.error) setDuplicate(result?.duplicate ?? null);
      return result;
    },
    { serialise, blocked: !editing || invalid, delay: 800 },
  );

  // Closing the tab cannot wait for a server round trip, so the browser is asked to hold on.
  const unsaved = editing && (autosave.dirty || autosave.status === 'saving');
  useEffect(() => {
    if (!unsaved) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  // Leaving waits for the last save, so the page you land on shows what you just typed.
  const leave = (href) => (event) => {
    event.preventDefault();
    // An unsaveable draft (no title, a bad key) cannot be flushed; say so rather than drop it.
    if (invalid && autosave.dirty && !window.confirm('Your latest changes can’t be saved until the highlighted field is fixed. Leave anyway?')) {
      return;
    }
    startTransition(async () => {
      if (editing && !(await autosave.flush())) return;
      router.push(href);
    });
  };

  const create = (force = false) => {
    setProblem(null);
    setDuplicate(null);

    startTransition(async () => {
      const result = await saveSong(payload(draft, force));
      if (result?.error) return setProblem(result.error);
      if (result?.duplicate && !result.id) return setDuplicate(result.duplicate);
      router.push(`/songs/${result.id}`);
    });
  };

  const tab = (value, label) => (
    <button
      type="button"
      role="tab"
      aria-selected={pane === value}
      onClick={() => setPane(value)}
      className={cn(
        '-mb-px h-11 border-b-2 px-0.5 text-[15px]',
        pane === value ? 'border-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      <Page className="pt-0">
        <PageBar>
          <BackLink
            href={editing ? `/songs/${initial.id}` : '/'}
            label={editing ? fields.title || 'Untitled' : 'Songs'}
            onClick={editing ? leave(`/songs/${initial.id}`) : undefined}
            className="mr-auto"
          />
          {editing ? (
            <>
              <span aria-live="polite">
                <SaveState status={autosave.status} invalid={invalid} onRetry={autosave.retry} />
              </span>
              <Button asChild className="h-10 rounded-xl px-5">
                <a href={`/songs/${initial.id}`} onClick={leave(`/songs/${initial.id}`)}>
                  {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Done
                </a>
              </Button>
            </>
          ) : (
            <Button type="button" className="h-10 rounded-xl px-5" disabled={invalid || pending} onClick={() => create()}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {pending ? 'Creating…' : 'Create song'}
            </Button>
          )}
        </PageBar>

        <form className="space-y-5" onSubmit={(event) => event.preventDefault()} noValidate>
          <h1 className="sr-only">{editing ? `Edit ${fields.title}` : 'New song'}</h1>

          {converted ? (
            <p className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand" />
              Converted from ChordPro. Check the spacing before you create the song — this is the only step that can
              change it.
            </p>
          ) : null}

          {problem ? (
            <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {problem}
            </p>
          ) : null}

          {duplicate ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary p-3 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-brand" />
              <span className="flex-1">
                You already have “{duplicate.title}”{duplicate.artist ? ` by ${duplicate.artist}` : ''}.
              </span>
              {editing ? null : (
                <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => create(true)}>
                  Create anyway
                </Button>
              )}
            </div>
          ) : null}

          {!editing && invalid ? (
            <p className="text-sm text-muted-foreground">Give it a title and a sheet, then create the song.</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Title"
              value={fields.title}
              onChange={set('title')}
              error={errors.title && fields.title !== initial.title ? errors.title : null}
              className="sm:col-span-2"
              autoComplete="off"
            />
            <Field label="Artist" value={fields.artist} onChange={set('artist')} autoComplete="off" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Key" value={fields.songKey} onChange={setKey} maxLength={3} error={errors.songKey} autoComplete="off" />
              <Field label="Capo" value={fields.capo} onChange={set('capo')} inputMode="numeric" />
              <Field label="Tempo" value={fields.bpm} onChange={set('bpm')} inputMode="numeric" hint="bpm" />
            </div>
            <Field label="Listen link" value={fields.mediaUrl} onChange={set('mediaUrl')} type="url" placeholder="https://" />
            <Field label="Tutorial link" value={fields.tutorialUrl} onChange={set('tutorialUrl')} type="url" placeholder="https://" />
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-medium">Tags</span>
            <TagPicker selected={tags} options={allTags} onChange={setTags} />
          </div>

          <div>
            <div role="tablist" aria-label="Sheet" className="flex items-center gap-5 border-b border-border">
              {tab('edit', 'Edit')}
              {tab('preview', 'Preview')}
              {unrecognised > 0 ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  {unrecognised} chord{unrecognised === 1 ? '' : 's'} not recognised
                </span>
              ) : null}
            </div>

            {pane === 'edit' ? (
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                wrap="off"
                aria-label="Sheet source"
                aria-invalid={errors.body ? true : undefined}
                className={cn(
                  'mt-3 block h-[70dvh] min-h-96 w-full resize-y rounded-xl border border-input bg-card p-4',
                  'font-mono leading-relaxed whitespace-pre',
                  // 16px on phones: anything smaller makes iOS zoom the page on focus.
                  'text-base sm:text-[0.9375rem]',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                )}
              />
            ) : (
              <div className="mt-3 min-h-96 rounded-xl border border-border bg-card p-4" aria-label="Preview">
                <SheetView body={body} shapes={shapes} songId={initial.id} prefs={prefs} />
              </div>
            )}
          </div>

          {editing ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="h-11 rounded-xl text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                  Delete this song
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
                  <AlertDialogAction variant="destructive" onClick={() => startTransition(() => removeSong(initial.id))}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </form>
      </Page>
    </>
  );
}
