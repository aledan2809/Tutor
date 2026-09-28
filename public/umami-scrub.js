/*
 * Runs before every Umami send (data-before-send on the tracker). Umami stores the page address and
 * the one before it on a server shared by several sites; some of our addresses carry secrets: the
 * password-reset link (?token=&email=), an invitation (/family/accept/<token>, ?code=), a class
 * access code (/acces/<code>), and sign-in's ?callbackUrl= repeating any of them. They are replaced
 * with "_" before anything leaves the page; campaign parameters (utm_*, voucher) stay.
 */
(function () {
  var SECRET_PARAMS = ["token", "code", "email", "callbackUrl"];
  function scrub(u) {
    if (!u || typeof u !== "string") return u;
    try {
      var url = new URL(u, window.location.origin);
      SECRET_PARAMS.forEach(function (p) {
        if (url.searchParams.has(p)) url.searchParams.set(p, "_");
      });
      url.pathname = url.pathname
        .replace(/^((?:\/(?:ro|en))?\/acces\/)[^/]+/, "$1_")
        .replace(/^((?:\/(?:ro|en))?\/family\/accept\/)[^/]+/, "$1_");
      url.hash = "";
      return /^https?:/i.test(u) ? url.toString() : url.pathname + url.search;
    } catch (e) {
      return "";
    }
  }
  window.etutorUmamiScrub = function (type, payload) {
    if (payload) {
      payload.url = scrub(payload.url);
      payload.referrer = scrub(payload.referrer);
    }
    return payload;
  };
})();
