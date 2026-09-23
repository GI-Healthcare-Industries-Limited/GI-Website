// The legacy Flutter app retains Careers navigation. Home and Research
// now belongs to the independently built 3D experience, so cross that boundary
// with a document navigation rather than rendering the retired Flutter home.
(function () {
  function goHomeIfNeeded() {
    var url = new URL(window.location.href);
    if ((url.pathname === '/' || url.pathname === '/index.html') &&
        ['space', 'research'].includes(url.searchParams.get('page'))) {
      window.location.replace('/research');
      return;
    }
    if ((url.pathname === '/' || url.pathname === '/index.html') &&
        (!url.searchParams.has('page') || url.searchParams.get('page') === 'home')) {
      window.location.replace('/');
    }
  }
  ['pushState', 'replaceState'].forEach(function (method) {
    var original = window.history[method];
    window.history[method] = function () {
      var result = original.apply(this, arguments);
      goHomeIfNeeded();
      return result;
    };
  });
  window.addEventListener('popstate', goHomeIfNeeded);
  goHomeIfNeeded();
}());
