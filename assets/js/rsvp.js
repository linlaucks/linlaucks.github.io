// RSVP: five separate pages that share answers until the final Submit.
//
// Flow:  start → roles (only if "invited to serve a role" = Yes) → hotel → dietary → final → thank-you
// If "Will you be attending?" = No, the start page submits straight away.
(function () {
  // Google Apps Script web app that writes each RSVP into the Google Sheet.
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxWhN_itCpd8vl2l7DO9Qcidb87hsfRHRvNq43Kl1h8TBvDsVdkDjoQRJL-lNo_SMAMeQ/exec";

  var KEY = "linlaucks-rsvp";
  var STEPS = {
    start: "rsvp/",
    roles: "rsvp/roles/",
    hotel: "rsvp/hotel/",
    dietary: "rsvp/dietary/",
    final: "rsvp/final/",
    thanks: "rsvp/thank-you/"
  };
  // Column order expected by the Google Apps Script
  var FIELDS = ["email", "attending", "names", "role", "rehearsal", "rehearsalOthers", "airbnb",
                "hotel", "roommate", "dietary", "dietaryOther", "cake", "alcohol"];

  var root = document.body.getAttribute("data-root") || "/";
  function t(s) { return window.I18N ? window.I18N.t(s) : s; }


  // ---------- storage ----------
  var memory = {};
  function load() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return memory; }
  }
  function save(data) {
    memory = data;
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }
  function clear() {
    memory = {};
    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }
  function go(step, query) { window.location.href = root + STEPS[step] + (query || ""); }

  // ---------- thank-you page ----------
  var thanks = document.querySelectorAll(".thanks");
  if (thanks.length) {
    var declined = /[?&]d=1/.test(location.search);
    thanks.forEach(function (el) {
      el.hidden = el.getAttribute("data-variant") !== (declined ? "no" : "yes");
    });
    return;
  }

  var form = document.querySelector(".rsvp-form");
  if (!form) return;
  var step = form.getAttribute("data-step");
  var data = load();

  // Someone landing mid-way (e.g. from a bookmark) starts at the beginning.
  if (step !== "start" && !data.email) { go("start"); return; }

  // ---------- fill in saved answers ----------
  Array.prototype.forEach.call(form.elements, function (el) {
    if (!el.name || el.name === "website") return;
    var val = data[el.name];
    if (val === undefined) return;
    if (el.type === "radio") el.checked = el.value === val;
    else if (el.type === "checkbox") el.checked = Array.isArray(val) && val.indexOf(el.value) !== -1;
    else el.value = val;
  });

  function collect() {
    var fd = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === "website") return;
      if (el.type === "radio") {
        if (el.checked) fd[el.name] = el.value;
        else if (!(el.name in fd)) fd[el.name] = "";
      } else if (el.type === "checkbox") {
        fd[el.name] = fd[el.name] || [];
        if (el.checked) fd[el.name].push(el.value);
      } else {
        fd[el.name] = el.value.trim();
      }
    });
    return fd;
  }

  function setError(name, msg) {
    var el = form.querySelector('[data-error-for="' + name + '"]');
    if (el) el.textContent = msg || "";
  }
  function status(msg) { form.querySelector(".form-status").textContent = msg || ""; }

  // ---------- page-specific behaviour ----------
  if (step === "start") {
    var group = form.querySelector(".attending-only");
    var nextBtn = form.querySelector('[data-action="next"]');
    var syncAttending = function () {
      var no = (form.querySelector('input[name="attending"]:checked') || {}).value === "No";
      group.classList.toggle("is-disabled", no);
      group.setAttribute("aria-disabled", no ? "true" : "false");
      Array.prototype.forEach.call(group.querySelectorAll("input, textarea"), function (el) { el.disabled = no; });
      nextBtn.textContent = no ? t("Submit") : t("Next");
    };
    form.addEventListener("change", function (e) { if (e.target.name === "attending") syncAttending(); });
    document.addEventListener("langchange", syncAttending);
    syncAttending();
  }

  if (step === "dietary") {
    var none = form.querySelector("#dietary-none");
    var otherCheck = form.querySelector("#dietary-other-check");
    var otherText = form.querySelector('input[name="dietaryOther"]');
    form.addEventListener("change", function (e) {
      if (e.target.name !== "dietary") return;
      if (e.target === none && none.checked) {
        form.querySelectorAll('input[name="dietary"]').forEach(function (c) { if (c !== none) c.checked = false; });
        otherText.value = "";
      } else if (e.target.checked) {
        none.checked = false;
      }
    });
    otherText.addEventListener("input", function () {
      if (otherText.value.trim()) { otherCheck.checked = true; none.checked = false; }
    });
  }

  // ---------- validation ----------
  function validate(fd) {
    var ok = true;
    form.querySelectorAll(".error").forEach(function (el) { el.textContent = ""; });
    if (step === "start") {
      if (!fd.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email)) {
        setError("email", t("Please enter a valid email address.")); ok = false;
      }
      if (!fd.attending) { setError("attending", t("Please let us know if you can make it.")); ok = false; }
      if (fd.attending === "Yes") {
        if (!fd.names) { setError("names", t("Please list who will be attending.")); ok = false; }
        if (!fd.role) { setError("role", t("Please choose yes or no.")); ok = false; }
      }
    }
    if (!ok) {
      var first = form.querySelector(".error:not(:empty)");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return ok;
  }

  // ---------- navigation ----------
  function prevStep() {
    switch (step) {
      case "roles": return "start";
      case "hotel": return data.role === "Yes" ? "roles" : "start";
      case "dietary": return "hotel";
      case "final": return "dietary";
    }
    return "start";
  }
  function nextStep() {
    switch (step) {
      case "start": return data.role === "Yes" ? "roles" : "hotel";
      case "roles": return "hotel";
      case "hotel": return "dietary";
      case "dietary": return "final";
    }
  }

  var backBtn = form.querySelector('[data-action="back"]');
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      data = Object.assign(load(), collect()); // keep answers when going back
      save(data);
      go(prevStep());
    });
  }

  // ---------- submit to Google Sheet ----------
  var sending = false;
  function send(payload, declined) {
    if (sending) return;
    sending = true;
    var btns = form.querySelectorAll(".btn");
    btns.forEach(function (b) { b.disabled = true; });
    var submitBtn = form.querySelector('[type="submit"]');
    var label = submitBtn.textContent;
    submitBtn.textContent = t("Sending…");
    status("");

    var body = new URLSearchParams();
    FIELDS.forEach(function (k) {
      var v = payload[k];
      body.append(k, Array.isArray(v) ? v.join(", ") : (v || ""));
    });
    body.append("website", (form.querySelector('input[name="website"]') || {}).value || "");

    fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: body })
      .then(function () {
        clear();
        go("thanks", declined ? "?d=1" : "");
      })
      .catch(function () {
        sending = false;
        btns.forEach(function (b) { b.disabled = false; });
        submitBtn.textContent = label;
        status(t("Sorry, something went wrong sending your RSVP. Please check your connection and try again."));
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = collect();
    if (!validate(fd)) return;
    data = Object.assign(load(), fd);

    if (step === "start" && data.attending === "No") {
      send({ email: data.email, attending: "No" }, true);
      return;
    }

    if (step === "start" && data.role !== "Yes") {
      // Clear any role answers from an earlier pass through the form.
      delete data.rehearsal; delete data.rehearsalOthers; delete data.airbnb;
    }
    save(data);

    if (step === "final") { send(data, false); return; }
    go(nextStep());
  });
})();
