/**
 * App-shell cache for the Studio PWA. This only caches the static files that make up the
 * interface itself (HTML/CSS/JS/icons) so the app opens instantly. It never caches calls to
 * the Apps Script API (script.google.com / script.googleusercontent.com) — those always hit
 * the network so you're never looking at stale Sheet data.
 */
var CACHE_NAME = "studio-shell-v1";
var SHELL_FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(SHELL_FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var url = e.request.url;
  if (e.request.method !== "GET" || url.indexOf("script.google") >= 0) {
    return; // let API calls (and anything non-GET) go straight to the network, untouched
  }
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var network = fetch(e.request)
        .then(function (resp) {
          if (resp && resp.status === 200) {
            var copy = resp.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(e.request, copy); });
          }
          return resp;
        })
        .catch(function () { return cached; });
      return cached || network;
    })
  );
});
