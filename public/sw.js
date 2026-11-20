// Named after the release
const CACHE = 'chordy-v1';

// Bare paths only. Next serves its own icon conventions under a content hash, so `/icon.svg`
// and `/apple-icon.png` would never be read back at the URL the page asks for.
const PRECACHE = [
  '/offline',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

async function precache() {
  const cache = await caches.open(CACHE);
  // One missing entry must not abandon the whole install, so each is added on its own.
  await Promise.allSettled(PRECACHE.map((path) => cache.add(path)));

  // An unstyled offline page is barely better than the browser's error, and its CSS and JS are
  // only in the cache if some other visited page happened to share them. Take the asset list
  // from the markup just stored rather than guessing at build hashes.
  const offline = await cache.match('/offline');
  if (!offline) return;

  const assets = new Set([...(await offline.text()).matchAll(/["'](\/_next\/static\/[^"']+)["']/g)].map((m) => m[1]));
  await Promise.allSettled([...assets].map((path) => cache.add(path)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

// Content-hashed, so a cached copy can never be out of date.
const isHashed = (pathname) => pathname.startsWith('/_next/static/');

// Same address whatever is inside: the icons, the manifest, the favicon, the offline page. These
// come from the network whenever there is one, so a new icon reaches phones on their next visit;
// the cached copy is only for when there is no connection.
const isNamed = (pathname) => pathname.startsWith('/icons/') || PRECACHE.includes(pathname);

const keep = (event, request, response) => {
  if (response.ok) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Pages and RSC payloads are never cached: each one is somebody's signed-in view of their own
  // songs. Offline gets the fallback page rather than a stale or foreign sheet.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')));
    return;
  }

  if (isHashed(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request).then((response) => keep(event, request, response))));
    return;
  }

  if (isNamed(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => keep(event, request, response))
        .catch(() => caches.match(request)),
    );
  }
});
