// Retire only this site's obsolete Flutter offline cache. Do not unregister
// unrelated workers. The homepage and forms must not use an old offline build.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    registrations.forEach(function (registration) {
      var worker = registration.active || registration.waiting || registration.installing;
      if (worker && new URL(worker.scriptURL).pathname.endsWith('/flutter_service_worker.js')) {
        registration.unregister();
      }
    });
  }).catch(function () {});
  if ('caches' in window) {
    caches.keys().then(function (keys) {
      keys.filter(function (key) { return key.startsWith('flutter-'); })
        .forEach(function (key) { caches.delete(key); });
    }).catch(function () {});
  }
}
