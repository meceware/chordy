'use server';

import { refresh } from 'next/cache';
import { requireUserId } from '@/lib/session';
import { addChordPref, removeChordPref } from '@/lib/chord-prefs';

export async function pinChordShape(songId, name, shapeRef) {
  const userId = await requireUserId();
  addChordPref(userId, songId, name, shapeRef);
  refresh();
}

export async function unpinChordShape(songId, name, shapeRef) {
  const userId = await requireUserId();
  removeChordPref(userId, songId, name, shapeRef);
  refresh();
}
