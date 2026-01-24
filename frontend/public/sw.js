// Service Worker للـ PWA - نسخة إصلاح الكاش 4
const CACHE_VERSION = 'v4-fix-' + Date.now(); // نسخة جديدة لإجبار التحديث
const CACHE_NAME = 'prince-shop-' + CACHE_VERSION;
const STATIC_CACHE = 'prince-shop-static-v1';

// قائمة الملفات الثابتة
const staticAssets = [
  '/assets/logo.png'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🔄 Installing new Service Worker:', CACHE_NAME);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('✅ Caching static assets');
        return cache.addAll(staticAssets).catch(err => {
          console.warn('⚠️ Failed to cache some assets:', err);
        });
      })
  );
  // تجاوز فترة الانتظار وتفعيل فوري
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Activating new Service Worker:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // حذف جميع الكاشات القديمة ما عدا الثابتة
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // السيطرة على جميع الصفحات فوراً
  return self.clients.claim();
});

// استراتيجية Network First - دائماً جلب الأحدث من الشبكة
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // تجاهل الطلبات غير HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // فقط GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // استراتيجية Network First: جرب الشبكة أولاً، ثم Cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // تحقق من صحة الاستجابة
        if (!response || response.status !== 200 || response.type === 'error') {
          // إذا فشلت، جرب Cache
          return caches.match(event.request).then(cached => cached || response);
        }

        // استنساخ الاستجابة للتخزين
        const responseToCache = response.clone();
        
        // تخزين الملفات الثابتة فقط (images, fonts, etc)
        if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)) {
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        
        return response;
      })
      .catch(() => {
        // في حالة فشل الشبكة، استخدم Cache
        return caches.match(event.request).then(cached => {
          if (cached) {
            return cached;
          }
          // رد افتراضي للصفحات HTML
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
  );
});

// رسالة للعميل عند وجود تحديث
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
