'use server';

import { refresh } from 'next/cache';
import { requireUserId } from '@/lib/session';
import { setBpm, setMetronome, setScrollSpeed, setTranspose, toggleFavourite } from '@/lib/songs';

export async function saveTranspose(id, semitones) {
  const userId = await requireUserId();
  setTranspose(userId, id, semitones);
}

export async function saveScrollSpeed(id, speed) {
  const userId = await requireUserId();
  setScrollSpeed(userId, id, speed);
}

export async function saveMetronome(id, pattern) {
  const userId = await requireUserId();
  setMetronome(userId, id, pattern);
}

export async function saveBpm(id, bpm) {
  const userId = await requireUserId();
  setBpm(userId, id, bpm);
}

export async function switchFavourite(id) {
  const userId = await requireUserId();
  toggleFavourite(userId, id);
  refresh();
}
