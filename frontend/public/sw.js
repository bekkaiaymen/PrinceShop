// Service Worker للـ PWA
const CACHE_NAME = 'prince-shop-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/logo.png'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// استراتيجية Network First مع Cache Fallback
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير المدعومة
  const url = new URL(event.request.url);
  
  // فقط HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // فقط GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // استنساخ الاستجابة فقط للنجاح
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // تجاهل أخطاء التخزين
              });
            });
        }
        
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال، استخدم الـ Cache
        return caches.match(event.request);
      })
  );
});
