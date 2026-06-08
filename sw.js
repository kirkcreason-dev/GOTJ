/* GOTJ 2026 Companion — service worker
   Handles: app-shell caching (offline), incoming push events (stage 2 / FCM),
   and notification clicks. The Operations console currently fires notifications
   locally via registration.showNotification(); the 'push' listener below is the
   hook a backend (Firebase Cloud Messaging) will use to broadcast to every fan. */

const CACHE = 'gotj-2026-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Network-first for navigations (so updates show), cache fallback offline. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
  );
});

/* ---- Push (stage 2): a backend POSTs a payload to the browser push service,
   the browser wakes this worker, and we show the notification. Payload shape:
   { title, body, tag, url }  ---- */
self.addEventListener('push', (e) => {
  let data = { title: 'GOTJ 2026', body: 'New alert from the Gathering.', tag: 'gotj', url: './' };
  try { if (e.data) data = Object.assign(data, e.data.json()); } catch (_) {}
  e.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        tag: data.tag || 'gotj',
        icon: './icon-192.png',
        badge: './icon-192.png',
        data: { url: data.url || './' },
        vibrate: [120, 60, 120]
      }),
      broadcast({ t: data.title, b: data.body })
    ])
  );
});

/* Relay an alert to every open app tab so the user-facing feed updates live.
   The admin console posts {type:'relay-alert', alert} here; incoming push
   broadcasts directly. Cross-device delivery still requires the push backend. */
function broadcast(alert) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    wins.forEach((w) => w.postMessage({ type: 'gotj-alert', alert: alert }));
  });
}

self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'relay-alert' && d.alert) { broadcast(d.alert); }
});

/* Tapping a notification focuses the open app or opens it. */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) return w.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
