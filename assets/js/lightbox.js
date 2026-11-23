// Tap / click a map to open it full screen.
// - Pinch (touch) or scroll wheel / trackpad (desktop) to zoom
// - Drag to pan, double-tap / double-click to zoom in or reset
// - Tap the dark background, the × button, or press Esc to close
(function () {
  var MAX_SCALE = 8;
  function t(s) { return window.I18N ? window.I18N.t(s) : s; }


  function openLightbox(src, alt, trigger) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", alt || t("Enlarged image"));

    var img = document.createElement("img");
    img.className = "lightbox-img";
    img.alt = alt || "";
    img.draggable = false;

    var close = document.createElement("button");
    close.type = "button";
    close.className = "lightbox-close";
    close.setAttribute("aria-label", t("Close"));
    close.innerHTML = "&times;";

    var hint = document.createElement("div");
    hint.className = "lightbox-hint";
    hint.textContent = window.matchMedia("(pointer: coarse)").matches
      ? t("Pinch to zoom · Tap outside to close")
      : t("Scroll to zoom · Drag to move · Click outside to close");

    box.appendChild(img);
    box.appendChild(close);
    box.appendChild(hint);
    document.body.appendChild(box);
    document.body.classList.add("lightbox-open");

    // ---- transform state ----
    var natW = 0, natH = 0;      // image size at scale 1 (fitted)
    var fit = 1;                 // fitted scale
    var scale = 1, tx = 0, ty = 0;

    function apply() {
      img.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
    }

    function layout() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var pad = Math.min(32, vw * 0.04);
      fit = Math.min((vw - pad * 2) / natW, (vh - pad * 2 - 30) / natH);
      img.style.width = natW + "px";
      img.style.height = natH + "px";
      scale = fit;
      tx = (vw - natW * scale) / 2;
      ty = (vh - natH * scale) / 2;
      apply();
    }

    function clamp() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var w = natW * scale, h = natH * scale;
      if (w <= vw) tx = (vw - w) / 2; else tx = Math.min(0, Math.max(vw - w, tx));
      if (h <= vh) ty = (vh - h) / 2; else ty = Math.min(0, Math.max(vh - h, ty));
    }

    function zoomAt(newScale, cx, cy) {
      newScale = Math.max(fit, Math.min(fit * MAX_SCALE, newScale));
      var k = newScale / scale;
      tx = cx - (cx - tx) * k;
      ty = cy - (cy - ty) * k;
      scale = newScale;
      clamp();
      apply();
    }

    img.onload = function () {
      natW = img.naturalWidth;
      natH = img.naturalHeight;
      layout();
      requestAnimationFrame(function () { box.classList.add("is-open"); });
    };
    img.src = src;

    // ---- pointer handling (mouse, pen, touch) ----
    var pointers = new Map();
    var start = null;       // gesture start snapshot
    var moved = false;
    var downTarget = null;
    var lastTap = 0;

    function snapshot() {
      var pts = Array.from(pointers.values());
      if (pts.length === 1) {
        return { x: pts[0].x, y: pts[0].y, tx: tx, ty: ty, scale: scale };
      }
      var a = pts[0], b = pts[1];
      return {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2,
        tx: tx, ty: ty, scale: scale
      };
    }

    box.addEventListener("pointerdown", function (e) {
      if (e.target === close) return;
      box.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) { moved = false; downTarget = e.target; }
      start = snapshot();
      if (pointers.size === 1 && e.target === img) box.classList.add("is-dragging");
    });

    box.addEventListener("pointermove", function (e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2 && start && start.dist) {
        var s = snapshot();
        var newScale = Math.max(fit * 0.9, Math.min(fit * MAX_SCALE, start.scale * (s.dist / start.dist)));
        var k = newScale / start.scale;
        tx = s.cx - (start.cx - start.tx) * k;
        ty = s.cy - (start.cy - start.ty) * k;
        scale = newScale;
        moved = true;
        apply();
      } else if (pointers.size === 1 && start && start.x !== undefined) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        if (moved && downTarget === img) {
          tx = start.tx + dx;
          ty = start.ty + dy;
          clamp();
          apply();
        }
      }
    });

    function endPointer(e) {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      box.classList.remove("is-dragging");
      if (scale < fit) { scale = fit; }
      clamp();
      apply();
      if (pointers.size > 0) { start = snapshot(); return; }

      if (!moved && e.type === "pointerup") {
        if (downTarget === box) { shut(); return; }   // tapped the background
        if (downTarget === img) {
          var now = Date.now();
          if (now - lastTap < 300) {               // double tap / double click
            if (scale > fit * 1.05) zoomAt(fit, e.clientX, e.clientY);
            else zoomAt(fit * 2.5, e.clientX, e.clientY);
            lastTap = 0;
          } else {
            lastTap = now;
          }
        }
      }
      start = null;
    }
    box.addEventListener("pointerup", endPointer);
    box.addEventListener("pointercancel", endPointer);

    box.addEventListener("wheel", function (e) {
      e.preventDefault();
      var factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022));
      zoomAt(scale * factor, e.clientX, e.clientY);
    }, { passive: false });

    // Safari's own pinch gesture events: block page zoom while open
    box.addEventListener("gesturestart", function (e) { e.preventDefault(); });

    function onKey(e) {
      if (e.key === "Escape") shut();
      if (e.key === "+" || e.key === "=") zoomAt(scale * 1.3, innerWidth / 2, innerHeight / 2);
      if (e.key === "-") zoomAt(scale / 1.3, innerWidth / 2, innerHeight / 2);
    }
    function onResize() { if (natW) layout(); }

    close.addEventListener("click", shut);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    close.focus({ preventScroll: true });

    function shut() {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("lightbox-open");
      box.remove();
      if (trigger) trigger.focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".zoomable");
    if (!btn) return;
    var small = btn.querySelector("img");
    openLightbox(btn.getAttribute("data-full") || small.src, small.alt, btn);
  });
})();
