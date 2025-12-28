// Service Worker - Push Notifications only
// Offline caching is not implemented

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Ansehen',
        },
        {
          action: 'close',
          title: 'Schliessen',
        },
      ]
    }
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})
