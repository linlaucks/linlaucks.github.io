// Home page: crossfade through the hero photos, ~6 seconds each.
(function () {
  var HOLD_MS = 6000;

  function start() {
    var slides = document.querySelectorAll(".hero-slide");
    if (slides.length < 2) return;

    // Ask the browser to fetch the remaining photos now so each fade is smooth.
    for (var i = 1; i < slides.length; i++) slides[i].loading = "eager";

    var current = 0;
    setInterval(function () {
      if (document.hidden) return;
      var next = (current + 1) % slides.length;
      var nextImg = slides[next];
      if (!nextImg.complete) return; // wait for it to finish loading
      slides[current].classList.remove("is-active");
      nextImg.classList.add("is-active");
      current = next;
    }, HOLD_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
