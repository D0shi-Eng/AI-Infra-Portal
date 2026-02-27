/**
 * theme.js
 * مسؤول عن:
 * - تبديل الثيم Dark/Light
 * - حفظ الاختيار في localStorage
 * ملاحظة أمنية:
 * - لا يوجد أي حقن HTML أو تحميل خارجي
 */

const ThemeManager = (() => {
  const STORAGE_KEY = "theme";
  const DEFAULT_THEME = "dark";

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = theme === "dark" ? "☀" : "🌙";
  }

  function toggleTheme() {
    const current = getTheme();
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  function init() {
    applyTheme(getTheme());
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", toggleTheme);
  }

  return { init };
})();