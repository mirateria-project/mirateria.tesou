/* しーちゃんの手相スキャン service worker — offline + auto update */
const VERSION = '1.4.0';
const CACHE = 'plm-' + VERSION;
const ASSETS = [
  './', './index.html', './tesou.html', './manifest.json',
  './img/icon-180.png', './img/hand-right.png', './img/hand-left.png', './img/icon-192.png', './img/icon-512.png', './img/logo.png', './img/opening.jpg',
  './img/san0.png', './img/san1.png', './img/san2.png', './img/san3.png', './img/san4.png',
  './img/san5.png', './img/san6.png', './img/san7.png', './img/san8.png', './img/san9.png',
  './img/sanh0.png','./img/sanh1.png','./img/sanh2.png','./img/sanh3.png','./img/sanh4.png','./img/sanh5.png','./img/sanh6.png','./img/sanh7.png','./img/sanh8.png','./img/sanh9.png',
  './img/sanc0.png','./img/sanc1.png','./img/sanc2.png','./img/sanc3.png','./img/sanc4.png','./img/sanc5.png','./img/sanc6.png','./img/sanc7.png','./img/sanc8.png','./img/sanc9.png',
  './img/shi01.jpg', './img/shi02.jpg', './img/shi03.jpg', './img/shi04.jpg', './img/shi05.jpg', './img/shi06.jpg',
  './img/shi07.jpg', './img/shi08.jpg', './img/shi09.jpg', './img/shi10.jpg', './img/shi11.jpg', './img/shi12.jpg',
  './img/face-smile.png','./img/face-think.png','./img/face-happy.png','./img/face-surprise.png','./img/face-worry.png','./img/face-angry.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(ASSETS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('plm-')) await caches.delete(k);
    await self.clients.claim();
  })());
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: keep a copy so the fonts work offline too
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(req);
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })());
    return;
  }
  if (url.origin !== location.origin) return;

  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('manifest.json');
  if (isPage) {
    // newest first, cached copy when offline
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await Promise.race([fetch(req, { cache: 'no-store' }), timeout(5000)]);
        if (r && r.ok) c.put(req, r.clone());
        return r;
      } catch (err) {
        return (await c.match(req, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(req); if (r && r.ok) c.put(req, r.clone()); return r; }
    catch (err) { return Response.error(); }
  })());
});
