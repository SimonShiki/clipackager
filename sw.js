// These will be replaced at build-time by generate-service-worker-plugin.js
const ASSETS = ["","js/download-project.cca61c021b349158fe1c.worker.js","assets/reset.80a6e1615fc013684ad8047dba5ce064.svg","assets/default-icon.290e09e569a1cab8e61ba93b0d23863f.png","js/vendors~icns~jszip~sha256.fccdd828c2f79705a30d.js","js/icns.0fe038a809ebb538a36c.js","js/jszip.f0caeb64fe2fdd41b37b.js","js/p4.153fc90e7090e58d13b2.js","js/packager-options-ui.9f16a08a1dac32c71774.js","js/sha256.282e207b67db10adf5b9.js"];
const CACHE_NAME = "p4-b7834c76c1a25f79d3062b07c709f9ec14b82c5fb4671be6749499994c321884";
const IS_PRODUCTION = true;

const base = location.pathname.substr(0, location.pathname.indexOf('sw.js'));

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.map(i => i === '' ? base : i))));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(i => i !== CACHE_NAME).map(i => caches.delete(i))))
  );
});

const fetchWithTimeout = (req) => new Promise((resolve, reject) => {
  const timeout = setTimeout(reject, 5000);
  fetch(req)
    .then((res) => {
      clearTimeout(timeout);
      resolve(res);
    })
    .catch((err) => {
      clearTimeout(timeout);
      reject(err);
    });
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  const relativePathname = url.pathname.substr(base.length);
  if (IS_PRODUCTION && ASSETS.includes(relativePathname)) {
    url.search = '';
    const immutable = !!relativePathname;
    if (immutable) {
      event.respondWith(
        caches.match(new Request(url)).then((res) => res || fetch(event.request))
      );
    } else {
      event.respondWith(
        fetchWithTimeout(event.request).catch(() => caches.match(new Request(url)))
      );
    }
  }
});
