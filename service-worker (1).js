const CACHE_NAME = "iplay-v3";

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // لا نتدخل في أي طلب خارجي
    if (url.origin !== self.location.origin) {
        return;
    }

    /*
     * OAuth callback
     * لازم ييجي دائمًا من الشبكة مباشرة.
     * لا Cache ولا Fallback.
     */
    if (url.pathname.endsWith("auth-callback.html")) {
        event.respondWith(
            fetch(request, {
                cache: "no-store"
            })
        );

        return;
    }

    /*
     * الفيديوهات
     *
     * الفيديوهات ممكن تستخدم Range Requests
     * وترجع 206 Partial Content.
     *
     * لذلك لا نحفظها في Service Worker Cache
     * ولا نستخدم نسخة من الكاش كـ fallback.
     */
    const isVideo =
        url.pathname.endsWith(".mp4") ||
        url.pathname.endsWith(".webm") ||
        url.pathname.endsWith(".mov");

    if (isVideo) {
        event.respondWith(
            fetch(request, {
                cache: "no-store"
            })
        );

        return;
    }

    /*
     * باقي الملفات المحلية:
     * Network First
     *
     * نحاول دائمًا الحصول على أحدث نسخة من السيرفر.
     *
     * لو الإنترنت غير متاح:
     * نستخدم آخر نسخة محفوظة في Service Worker Cache.
     */
    event.respondWith(
        fetch(request, {
            cache: "no-store"
        })
            .then((response) => {
                if (response && response.ok) {
                    const responseToCache = response.clone();

                    event.waitUntil(
                        caches.open(CACHE_NAME).then((cache) => {
                            return cache.put(request, responseToCache);
                        })
                    );
                }

                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});