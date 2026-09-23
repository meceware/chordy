'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUserId } from '@/lib/session';
import { createSong, updateSong, deleteSong, findDuplicate } from '@/lib/songs';
import { normaliseKey } from '@/lib/song-key';

function clean(value) {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

function number(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveSong(input) {
  const userId = await requireUserId();

  const title = clean(input.title);
  if (!title) return { error: 'A title is required.' };
  if (!input.body?.trim()) return { error: 'The sheet is empty.' };

  const songKey = normaliseKey(input.songKey);
  if (songKey === null) return { error: 'Key must be a note from A to G, optionally with # or b and m for minor.' };

  const artist = clean(input.artist) ?? 'Unknown';
  const duplicate = findDuplicate(userId, title, artist, input.id ?? null);
  if (duplicate && !input.force) return { duplicate };

  const fields = {
    title,
    artist,
    // Leading spaces set the columns, so they are untouchable; trailing spaces are
    // invisible and only ever noise, so each line loses them.
    body: input.body.split('\n').map((line) => line.replace(/\s+$/, '')).join('\n').replace(/\n+$/, ''),
    songKey: songKey === '' ? null : songKey,
    capo: number(input.capo),
    bpm: number(input.bpm),
    mediaUrl: clean(input.mediaUrl),
    tutorialUrl: clean(input.tutorialUrl),
  };

  const tags = input.tags ?? [];

  if (input.id) {
    updateSong(userId, input.id, fields, tags);
    revalidatePath(`/songs/${input.id}`, 'max');
    revalidatePath('/', 'max');
    return { id: Number(input.id) };
  }

  const id = createSong(
    userId,
    { ...fields, sourceText: input.sourceText ?? fields.body, sourceFormat: input.sourceFormat ?? 'text' },
    tags,
  );
  revalidatePath('/', 'max');
  return { id };
}

export async function removeSong(id) {
  const userId = await requireUserId();
  deleteSong(userId, id);
  revalidatePath('/', 'max');
  redirect('/');
}
