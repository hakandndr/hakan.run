// Runs in <head>, before the body is parsed or painted. A classic blocking
// script so the Content Security Policy needs no inline-script allowance.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
// BootIntro is first-entry presentation for the public site. It is decided
// here, before the body paints, and claimed once per tab session.
(function () {
  var show = false;
  if (!/^\/(notes|boss)(\/|$)/.test(location.pathname)) {
    try {
      show = sessionStorage.getItem('hakan.run:boot-intro-seen') !== '1';
      if (show) sessionStorage.setItem('hakan.run:boot-intro-seen', '1');
    } catch (error) {
      show = true;
    }
  }
  if (!show) document.documentElement.setAttribute('data-boot-intro', 'off');
})();
