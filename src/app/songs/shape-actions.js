'use server';

import { refresh } from 'next/cache';
import { requireUserId } from '@/lib/session';
import { addChordShape, removeChordShape } from '@/lib/chord-shapes';

export async function saveChordShape(name, shape) {
  const userId = await requireUserId();
  const result = addChordShape(userId, name, shape);

  if (result.error) return result;
  refresh();
  return { ok: true };
}

export async function deleteChordShape(id) {
  const userId = await requireUserId();
  removeChordShape(userId, id);
  refresh();
}
