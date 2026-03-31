const CACHE_NAME = 'ohr-cache-v3-0-2-0';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './shema.html',
  './hitbodedut.html'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => Promise.resolve()))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => Promise.resolve());
      return res;
    }).catch(() => cached))
  );
});

async function showOhrNotification(payload = {}) {
  const title = payload.title || 'Ohr';
  const body = payload.body || 'Uma nova lembrança espiritual está aguardando você.';
  const url = payload.url || './index.html';
  const tag = payload.tag || 'ohr-push';
  return self.registration.showNotification(title, {
    body,
    tag,
    icon: './icon-192.png',
    badge: './icon-192.png',
    renotify: true,
    data: { url }
  });
}

self.addEventListener('push', event => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { body: event.data.text() };
    }
  }
  event.waitUntil(showOhrNotification(payload));
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'OHR_TEST_NOTIFICATION') {
    event.waitUntil(showOhrNotification({
      title: data.title || 'Teste do Ohr 🔔',
      body: data.body || 'O service worker recebeu sua mensagem e está vivo neste aparelho.',
      url: './index.html',
      tag: 'ohr-sw-test'
    }));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(allClients => {
      for (const client of allClients) {
        if ('focus' in client) {
          try { client.navigate(url); } catch (e) {}
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
