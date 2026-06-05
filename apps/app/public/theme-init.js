// Anti-flash : applique le thème avant le rendu (externalisé pour une CSP stricte
// sans 'unsafe-inline' sur script-src).
(function () {
  try {
    var t = localStorage.getItem('drwindesk.theme') || 'system';
    var dark =
      t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
