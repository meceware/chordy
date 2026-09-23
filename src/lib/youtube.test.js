import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeId } from './youtube.js';

test('extracts the id from every YouTube url shape', () => {
  const cases = {
    'https://www.youtube.com/watch?v=V1bFr2SWP1I': 'V1bFr2SWP1I',
    'https://www.youtube.com/watch?list=PL123&v=V1bFr2SWP1I': 'V1bFr2SWP1I',
    'https://www.youtube.com/watch?v=V1bFr2SWP1I&t=42s': 'V1bFr2SWP1I',
    'https://youtu.be/V1bFr2SWP1I': 'V1bFr2SWP1I',
    'https://youtu.be/V1bFr2SWP1I?t=42': 'V1bFr2SWP1I',
    'https://www.youtube.com/embed/V1bFr2SWP1I': 'V1bFr2SWP1I',
    'https://www.youtube.com/shorts/V1bFr2SWP1I': 'V1bFr2SWP1I',
  };

  for (const [url, id] of Object.entries(cases)) {
    assert.equal(youtubeId(url), id, url);
  }
});

test('returns null for anything that is not a YouTube video', () => {
  assert.equal(youtubeId(null), null);
  assert.equal(youtubeId(''), null);
  assert.equal(youtubeId('https://open.spotify.com/track/6mFkJmJqdDVQ1REhVfGgd1'), null);
  assert.equal(youtubeId('https://vimeo.com/123456'), null);
  assert.equal(youtubeId('https://www.youtube.com/@someChannel'), null);
});
