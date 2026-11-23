// English / 中文 language toggle.
//
// Every translated element carries its Chinese text in a data-zh attribute
// (and data-zh-alt / data-zh-aria-label for image descriptions and labels).
// The English text stays in the page as normal, so the site works the same
// without JavaScript. The chosen language is remembered on this device.
(function () {
  var KEY = "linlaucks-lang";
  var html = document.documentElement;
  var ATTRS = ["alt", "aria-label"];

  // Strings that are created by the other scripts (errors, button states, hints).
  var JS = {
      "Please enter a valid email address.": "请输入有效的电子邮箱地址。",
      "Please let us know if you can make it.": "请告诉我们您是否能出席。",
      "Please list who will be attending.": "请列出出席者的姓名。",
      "Please choose yes or no.": "请选择“是”或“否”。",
      "Sorry, something went wrong sending your RSVP. Please check your connection and try again.": "抱歉，发送回复时发生问题，请检查网络连接后再试一次。",
      "Sending…": "发送中…",
      "Submit": "提交",
      "Next": "下一步",
      "Please enter the password.": "请输入密码。",
      "That password isn’t right. Please try again.": "密码不正确，请再试一次。",
      "Pinch to zoom · Tap outside to close": "双指缩放 · 点击外侧关闭",
      "Scroll to zoom · Drag to move · Click outside to close": "滚动缩放 · 拖动平移 · 点击外侧关闭",
      "Close": "关闭",
      "Enlarged image": "放大图片"
  };

  var lang = "en";
  try { if (localStorage.getItem(KEY) === "zh") lang = "zh"; } catch (e) { /* ignore */ }

  function apply(root) {
    root = root || document;
    var zh = lang === "zh";
    root.querySelectorAll("[data-zh]").forEach(function (el) {
      if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
      el.innerHTML = zh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
    });
    ATTRS.forEach(function (a) {
      root.querySelectorAll("[data-zh-" + a + "]").forEach(function (el) {
        if (!el.hasAttribute("data-en-" + a)) el.setAttribute("data-en-" + a, el.getAttribute(a) || "");
        el.setAttribute(a, zh ? el.getAttribute("data-zh-" + a) : el.getAttribute("data-en-" + a));
      });
    });
    if (root === document) {
      html.lang = zh ? "zh-Hans" : "en";
      html.classList.toggle("zh", zh);
      var t = document.querySelector("title[data-zh]");
      if (t) document.title = t.textContent;
    }
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
    apply(document);
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  window.I18N = {
    get lang() { return lang; },
    t: function (s) { return lang === "zh" && JS[s] ? JS[s] : s; },
    apply: apply
  };

  function start() {
    apply(document);
    html.classList.remove("i18n-pending");
    document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () { setLang(lang === "zh" ? "en" : "zh"); });
    });
  }

  // Bridal Party pages reveal their content after the password is entered.
  document.addEventListener("contentrevealed", function (e) { apply(e.target === document ? document.getElementById("main") : e.target); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
