/* DGXEN Web Push Service Worker
 * Host next to admin.html on GitHub Pages (same origin).
 * Scope: '/' (or the Pages subpath if the site is under /repo/)
 */
const SW_VERSION = 'dgxen-push-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'DGXEN Admin',
    body: 'New alert',
    icon: './logo.png',
    badge: './logo.png',
    url: './admin.html',
    tag: 'dgxen-push',
    requireInteraction: false
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = Object.assign(data, parsed || {});
    }
  } catch (e) {
    try {
      data.body = event.data ? event.data.text() : data.body;
    } catch (e2) {}
  }

  const options = {
    body: data.body || '',
    icon: data.icon || './logo.png',
    badge: data.badge || data.icon || './logo.png',
    image: data.image || undefined,
    tag: data.tag || 'dgxen-push',
    renotify: !!data.renotify,
    requireInteraction: data.requireInteraction !== false,
    vibrate: data.vibrate || [120, 60, 120],
    data: {
      url: data.url || './admin.html',
      payload: data
    },
    actions: data.actions || [
      { action: 'open', title: 'Open Admin' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DGXEN', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || './admin.html';
  const abs = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of all) {
        if (c.url && c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
          try {
            await c.focus();
            if ('navigate' in c) await c.navigate(abs);
          } catch (e) {}
          return;
        }
      }
      if (clients.openWindow) await clients.openWindow(abs);
    })()
  );
});

self.addEventListener('notificationclose', () => {});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
