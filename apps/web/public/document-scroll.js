// Runs right after the application root is parsed. A server-rendered document
// already has its final height here, so a reload or history load can take its
// saved position before the first paint. ScrollManager applies the same
// checkpoint after hydration.
(function () {
  try {
    var saved = history.state && history.state.__hakanRunScroll;
    if (saved && document.getElementById('root').firstElementChild) window.scrollTo(saved.x, saved.y);
  } catch (error) {}
})();
