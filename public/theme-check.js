(function() {
  try {
    var t = localStorage.getItem('teachai-theme');
    var d = window.matchMedia('(prefers-color-scheme:dark)').matches;
    if (t === 'dark' || (t === null && d)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
