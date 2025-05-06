'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "bbe2cadbeb57f794ebf33b27e9ecdc22",
"version.json": "2b521e10dfa0f067561de489a19d6620",
"index.html": "f187bfaa67c60626c0e0c04c57f46592",
"/": "f187bfaa67c60626c0e0c04c57f46592",
"main.dart.js": "44002de551936b759202f8b8299d7dc3",
"flutter.js": "4b2350e14c6650ba82871f60906437ea",
"favicon.png": "69e5ca65774e82f2616032864e83d0b6",
"icons/Icon-192.png": "62909c9f8f40ebd4d09aa519f93886bb",
"icons/Icon-maskable-192.png": "62909c9f8f40ebd4d09aa519f93886bb",
"icons/Icon-maskable-512.png": "a05de27f24fad1037fa951930ac1a178",
"icons/Icon-512.png": "a05de27f24fad1037fa951930ac1a178",
"manifest.json": "b327fef801fd4536a68fb23da369003d",
"assets/AssetManifest.json": "7effa3aa869b4e3a93cf7f955bcf04f7",
"assets/NOTICES": "72225614b08ee62def5ee7b53dc15fab",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/AssetManifest.bin.json": "817bde808ee82385e9002dbca12f880e",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "e986ebe42ef785b27164c36a9abc7818",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "70f7b080859a3a0832834054a854bcae",
"assets/fonts/MaterialIcons-Regular.otf": "9853e1e4b684886ca6a58fe4c70392ca",
"assets/assets/images/linkedin.webp": "36da881e7b6c95b6acd904b70481ffe8",
"assets/assets/images/machine_map.webp": "eaf88ab1feca86e1ea12ffebde7efc0f",
"assets/assets/images/red_mail.webp": "491249187507f472c10bfaa07610eadc",
"assets/assets/images/arrows.webp": "7048198a9ff3af693a116712b0238291",
"assets/assets/images/rafi.webp": "c1fca2974f9429f7a13626fab68778b7",
"assets/assets/images/mars.webp": "9420d070a1d5f9e8372d4199e100e7bf",
"assets/assets/images/butterfly.webp": "26be99e570f38210c878b69c543cf630",
"assets/assets/images/red_phone.webp": "53b62d308b5e10e9eee8cefeddeb1820",
"assets/assets/images/astronauts.webp": "5e55c2584cea277527a212cf7197b29c",
"assets/assets/images/link.webp": "49444411e7b45d1b0a334f644d29c248",
"assets/assets/images/chris.webp": "32183f48e439de9fe2035ae49604ad93",
"assets/assets/images/neptune.webp": "3b937769f2705a3683a554291464f8de",
"assets/assets/images/jake.webp": "cd8abed5b8e05e5d66e590990bf85522",
"assets/assets/images/bailey.webp": "7889c1d65c3742d283760e713f7814ef",
"assets/assets/images/logo.webp": "1fb420cae1766c8cfbb5214fc7f8ba62",
"assets/assets/images/hq_address.webp": "7ba8a96901d58b36d37a03002b59b221",
"assets/assets/images/uob.webp": "8f8d49dd90a2240bae75a774614eeccd",
"assets/assets/images/red_linkedin.webp": "f668e78376879367ef60b4916a5cd54d",
"assets/assets/images/rd_address.webp": "f1f2b31124bf457ca9bc239dd55347c7",
"assets/assets/images/innovate_uk.webp": "b1f33fcfa729195bf731765f788bf469",
"assets/assets/images/uksa.webp": "078701e361642fd23a8d004f2329171b",
"assets/assets/images/arrow.webp": "bf2de757b2cc7e0cc33b1a340cf13667",
"assets/assets/images/divider.webp": "7722abe4dc5e5344c615e711d8f97e39",
"assets/assets/images/mod_small.webp": "e135773994664c0f2e60ad5e673d4138",
"assets/assets/images/mission.webp": "7abf01488b0a460b311d0bb1e7483981",
"assets/assets/images/moon.webp": "49229d5acba7f48aff9d33bcf8a21494",
"assets/assets/images/uwe.webp": "9b129fbaa7d097485679f011c79e9bdf",
"assets/assets/images/mercury.webp": "4f2a4dd2f5536eabb4e0c577024d4c51",
"assets/assets/images/cb.webp": "2456f0f8cfde036361e4c3fe2f5b485e",
"assets/assets/images/ash.webp": "ec27af918758e546786014414303763c",
"assets/assets/images/earth.webp": "08d9221cdab7f45b449b61915c5c4b2f",
"assets/assets/images/nr.webp": "4aec0df7539405d47bc09bcc004d2b83",
"assets/assets/images/eagle_labs.webp": "58432c8af84afa31e73b9342a296ede0",
"assets/assets/images/santander.webp": "6bcd7784a69d5e6193a44e90e304955d",
"assets/assets/images/vision.webp": "e494f9e48d094a5e2d23e36594e53d77",
"assets/assets/images/adip.webp": "57fa9375664d53c48fc33ee7bd794a19",
"assets/assets/images/mod.webp": "b0cb31b7dc99d6457dc00090b177ebf1",
"assets/assets/images/red_map_pin.webp": "fced0c33fdc0aefbfb630968711b2bc1",
"assets/assets/images/space_garden.webp": "81f8ffb136fb12f58998b64e788ad95d",
"assets/assets/images/white_butterfly.webp": "3904ed3387a631b5d1f55019e6bf969c",
"assets/assets/images/red_x.webp": "496fbba9dce1160e3d3295cf970287b5",
"assets/assets/images/hwu.webp": "2c349cc031fff11b8b1ba1313dbce1ac",
"assets/assets/images/apollo_10.webp": "ef5efd91295e9a959078b70dd87f1ee7",
"assets/assets/videos/bg_video.mp4": "d3db95f5c56abd54414359e94df2a064",
"canvaskit/skwasm.js": "ac0f73826b925320a1e9b0d3fd7da61c",
"canvaskit/skwasm.js.symbols": "96263e00e3c9bd9cd878ead867c04f3c",
"canvaskit/canvaskit.js.symbols": "efc2cd87d1ff6c586b7d4c7083063a40",
"canvaskit/skwasm.wasm": "828c26a0b1cc8eb1adacbdd0c5e8bcfa",
"canvaskit/chromium/canvaskit.js.symbols": "e115ddcfad5f5b98a90e389433606502",
"canvaskit/chromium/canvaskit.js": "b7ba6d908089f706772b2007c37e6da4",
"canvaskit/chromium/canvaskit.wasm": "ea5ab288728f7200f398f60089048b48",
"canvaskit/canvaskit.js": "26eef3024dbc64886b7f48e1b6fb05cf",
"canvaskit/canvaskit.wasm": "e7602c687313cfac5f495c5eac2fb324",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
