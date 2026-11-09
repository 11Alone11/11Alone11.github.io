/**
 * Тема оформления.
 * Начальное значение выставляет инлайн-скрипт в <head>, здесь — только переключение.
 */
const THEME_KEY = "theme";
const root = document.documentElement;

function applyTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    /* приватный режим — тема просто не запомнится */
  }
}

function toggleTheme() {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduce) {
    applyTheme(next);
    return;
  }

  document.startViewTransition(() => applyTheme(next));
}

document.querySelector(".js-theme-toggle")?.addEventListener("click", toggleTheme);
