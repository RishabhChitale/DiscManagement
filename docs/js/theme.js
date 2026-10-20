// Theme: follows the operating system until the visitor picks one; the choice is remembered.
// Loaded in <head> so the right theme is set before the page paints (no flash).
(function () {
  var KEY = "f95.theme", root = document.documentElement;
  var mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "dark");
      btn.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    }
  }

  apply(stored() || (mq && mq.matches ? "dark" : "light"));
  if (mq && mq.addEventListener) {
    mq.addEventListener("change", function (e) { if (!stored()) apply(e.matches ? "dark" : "light"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    apply(root.getAttribute("data-theme"));
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch (e) { /* choice just won't persist */ }
      apply(next);
    });
  });
})();
