// Password gate for the Bridal Party pages.
//
// The page content is stored encrypted (AES-256-GCM, key derived from the
// password with PBKDF2-SHA256), so it can't be read from the page source
// without the password. Once unlocked, the key is remembered on this device
// so the other Bridal Party pages open without asking again.
(function () {
  var STORE = "linlaucks-bridal-key";
  var locked = document.getElementById("locked");
  if (!locked) return;

  var main = document.getElementById("main");
  var form = document.querySelector(".gate");
  var input = form.querySelector('input[type="password"]');
  var err = form.querySelector(".error");
  var btn = form.querySelector(".btn");

  var salt = b64(locked.getAttribute("data-salt"));
  var iv = b64(locked.getAttribute("data-iv"));
  var data = b64(locked.getAttribute("data-ct"));
  var iterations = parseInt(locked.getAttribute("data-iter"), 10);

  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function toB64(buf) {
    var bytes = new Uint8Array(buf), s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function deriveRaw(password) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"])
      .then(function (base) {
        return crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" }, base, 256);
      });
  }

  function decryptWith(raw) {
    return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"])
      .then(function (key) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data); })
      .then(function (plain) { return new TextDecoder().decode(plain); });
  }

  function reveal(html) {
    main.innerHTML = html;
    document.documentElement.classList.remove("is-locked");
  }

  function remember(raw) {
    try { localStorage.setItem(STORE, toB64(raw)); } catch (e) { /* private mode */ }
  }
  function forget() {
    try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
  }

  // Already unlocked on this device?
  var saved = null;
  try { saved = localStorage.getItem(STORE); } catch (e) { /* ignore */ }
  if (saved) {
    decryptWith(b64(saved)).then(reveal, function () { forget(); show(); });
  } else {
    show();
  }

  function show() {
    form.hidden = false;
    input.focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.textContent = "";
    var pw = input.value;
    if (!pw) { err.textContent = "Please enter the password."; return; }
    btn.disabled = true;
    deriveRaw(pw)
      .then(function (raw) {
        return decryptWith(raw).then(function (html) { remember(raw); reveal(html); });
      })
      .catch(function () {
        err.textContent = "That password isn’t right. Please try again.";
        input.select();
      })
      .then(function () { btn.disabled = false; });
  });
})();
