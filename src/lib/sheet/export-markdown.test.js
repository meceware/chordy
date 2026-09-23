import test from 'node:test';
import assert from 'node:assert/strict';
import { songToMarkdown, markdownFilename } from './export-markdown.js';

const song = {
  title: 'Somewhere Over the Rainbow',
  artist: 'Harold Arlen',
  songKey: 'C',
  capo: 2,
  bpm: 84,
  tags: ['standards', 'fingerstyle'],
  mediaUrl: 'https://example.com/listen',
  tutorialUrl: null,
  body: 'C                  Em\nSomewhere over the rainbow',
};

test('the sheet body sits inside a fence so the spacing survives', () => {
  const markdown = songToMarkdown(song);
  const fenced = markdown.split('```');

  assert.equal(fenced.length, 3);
  assert.equal(fenced[1], '\nC                  Em\nSomewhere over the rainbow\n');
});

test('metadata and links come through', () => {
  const markdown = songToMarkdown(song);

  assert.match(markdown, /^# Somewhere Over the Rainbow$/m);
  assert.match(markdown, /^\*Harold Arlen\*$/m);
  assert.match(markdown, /\*\*Key:\*\* C · \*\*Capo:\*\* 2 · \*\*Tempo:\*\* 84 bpm/);
  assert.match(markdown, /- \[Listen\]\(https:\/\/example\.com\/listen\)/);
  assert.doesNotMatch(markdown, /Tutorial/);
});

test('a body containing backticks gets a longer fence', () => {
  const markdown = songToMarkdown({ ...song, body: 'C\n``` not a fence ```' });
  assert.match(markdown, /````\n/);
});

test('empty fields are left out rather than rendered blank', () => {
  const markdown = songToMarkdown({ title: 'Untitled', body: 'C G' });

  assert.doesNotMatch(markdown, /\*\*Key/);
  assert.doesNotMatch(markdown, /Listen/);
  assert.match(markdown, /^# Untitled$/m);
});

test('the filename is derived from the title and artist', () => {
  assert.equal(markdownFilename(song), 'somewhere-over-the-rainbow-harold-arlen.md');
  assert.equal(markdownFilename({ title: 'C/B & Friends?' }), 'cb-friends.md');
  assert.equal(markdownFilename({ title: '???' }), 'sheet.md');
});
