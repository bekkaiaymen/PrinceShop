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
    caches.match(event.request)
      .then((cachedResponse) => {
        // إذا موجود في cache، أرجعه مباشرة
        if (cachedResponse) {
          return cachedResponse;
        }

        // إن لم يكن، اجلبه من الشبكة
        return fetch(event.request)
          .then((response) => {
            // تحقق من صحة الاستجابة
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // استنساخ الاستجابة
            const responseToCache = response.clone();
            
            // حفظ في cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache).catch(() => {
                  // تجاهل أخطاء التخزين
                });
              });
            
            return response;
          })
          .catch(() => {
            // في حالة الفشل، لا تفعل شيء (دع المتصفح يتعامل معه)
            return new Response('', { status: 404, statusText: 'Not Found' });
          });
      })
  );
});
