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

/* Сравнение «до / после» */
document.querySelectorAll(".js-compare").forEach(function (block) {
  var range = block.querySelector(".compare__range");
  if (!range) return;
  range.addEventListener("input", function () {
    block.style.setProperty("--pos", range.value + "%");
  });
});

/* Анатомия страницы */
var anatomyButton = document.querySelector(".js-anatomy");

if (anatomyButton) {
  anatomyButton.addEventListener("click", function () {
    var enabled = document.documentElement.classList.toggle("is-anatomy");
    anatomyButton.setAttribute("aria-pressed", String(enabled));
  });
}

/* Вес страницы: сколько реально пришло по сети */
var budgetField = document.querySelector(".js-budget");

if (budgetField && window.performance && performance.getEntriesByType) {
  window.addEventListener("load", function () {
    var nav = performance.getEntriesByType("navigation")[0];
    var resources = performance.getEntriesByType("resource");
    var total = (nav ? nav.transferSize : 0);

    resources.forEach(function (entry) {
      total += entry.transferSize || 0;
    });

    if (total > 0) {
      var label = budgetField.getAttribute("data-label") || "this page";
      var unit = document.documentElement.lang === "en" ? " KB" : " КБ";
      budgetField.textContent = label + ": " + Math.round(total / 1024) + unit;
    }
  });
}
