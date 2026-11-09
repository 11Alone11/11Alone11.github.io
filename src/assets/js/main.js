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

/* Командная палитра */
var palette = document.querySelector(".js-palette");
var paletteInput = document.querySelector(".js-palette-input");
var paletteItems = palette ? Array.prototype.slice.call(palette.querySelectorAll(".palette__item")) : [];
var activeIndex = 0;

function visibleItems() {
  return paletteItems.filter(function (item) { return !item.hidden; });
}

function selectItem(index) {
  var items = visibleItems();
  if (!items.length) return;
  activeIndex = (index + items.length) % items.length;
  paletteItems.forEach(function (item) { item.setAttribute("aria-selected", "false"); });
  items[activeIndex].setAttribute("aria-selected", "true");
  items[activeIndex].scrollIntoView({ block: "nearest" });
}

function filterPalette() {
  var query = paletteInput.value.trim().toLowerCase();
  paletteItems.forEach(function (item) {
    item.hidden = query !== "" && item.textContent.toLowerCase().indexOf(query) === -1;
  });
  palette.querySelectorAll(".palette__group").forEach(function (group) {
    var next = group.nextElementSibling;
    var hasVisible = false;
    while (next && !next.classList.contains("palette__group")) {
      if (!next.hidden) hasVisible = true;
      next = next.nextElementSibling;
    }
    group.hidden = !hasVisible;
  });
  selectItem(0);
}

function copyEmail() {
  var link = document.querySelector('a[href^="mailto:"]');
  if (!link) return;
  var email = link.getAttribute("href").replace("mailto:", "");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email);
  }
}

function runAction(item) {
  if (!item) return;
  var action = item.getAttribute("data-action");

  if (action === "navigate") {
    var href = item.getAttribute("data-href");
    if (href) window.location.href = href;
    return;
  }

  if (action === "theme") {
    document.querySelector(".js-theme-toggle").click();
    palette.close();
    return;
  }

  if (action === "copy") {
    copyEmail();
    var label = item.querySelector("span");
    var original = label.textContent;
    label.textContent = item.getAttribute("data-copied") || label.textContent;
    window.setTimeout(function () { label.textContent = original; }, 1200);
    return;
  }

  if (action === "print") {
    palette.close();
    window.location.href = (document.documentElement.lang === "en" ? "/en/cv/" : "/cv/");
    window.setTimeout(function () { window.print(); }, 600);
  }
}

if (palette && paletteInput) {
  document.querySelectorAll(".js-palette-open").forEach(function (button) {
    button.addEventListener("click", function () {
      palette.showModal();
      paletteInput.value = "";
      filterPalette();
      paletteInput.focus();
    });
  });

  paletteInput.addEventListener("input", filterPalette);

  palette.addEventListener("keydown", function (event) {
    var items = visibleItems();

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectItem(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectItem(activeIndex - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      runAction(items[activeIndex]);
    }
  });

  paletteItems.forEach(function (item) {
    item.addEventListener("click", function () { runAction(item); });
  });

  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (palette.open) { palette.close(); return; }
      palette.showModal();
      paletteInput.value = "";
      filterPalette();
      paletteInput.focus();
    }
  });
}
