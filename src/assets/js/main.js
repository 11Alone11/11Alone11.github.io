const root = document.documentElement;
const THEME_KEY = "theme";

/* Тема. Начальное значение выставляет инлайн-скрипт в <head>,
   здесь — переключение с круговой заливкой из точки клика. */
function applyTheme(theme) {
  root.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    /* приватный режим: тема просто не запомнится */
  }
}

function toggleTheme(event) {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduceMotion) {
    applyTheme(next);
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  root.style.setProperty("--theme-x", `${rect.left + rect.width / 2}px`);
  root.style.setProperty("--theme-y", `${rect.top + rect.height / 2}px`);
  document.startViewTransition(() => applyTheme(next));
}

document.querySelector(".js-theme-toggle")?.addEventListener("click", toggleTheme);

/* Сравнение «до / после»: ползунок двигает границу между кадрами. */
for (const block of document.querySelectorAll(".js-compare")) {
  const range = block.querySelector(".compare__range");

  range?.addEventListener("input", () => {
    block.style.setProperty("--pos", `${range.value}%`);
  });
}

/* Анатомия страницы: показывает сетку и контуры блоков. */
const anatomyButton = document.querySelector(".js-anatomy");

anatomyButton?.addEventListener("click", () => {
  const enabled = root.classList.toggle("is-anatomy");
  anatomyButton.setAttribute("aria-pressed", String(enabled));
});

/* Вес страницы: суммарный transferSize этого открытия. */
const budgetField = document.querySelector(".js-budget");

if (budgetField && performance.getEntriesByType) {
  window.addEventListener("load", () => {
    const [navigation] = performance.getEntriesByType("navigation");
    const resources = performance.getEntriesByType("resource");
    const total = resources.reduce((sum, entry) => sum + (entry.transferSize || 0), navigation?.transferSize || 0);

    if (total > 0) {
      const label = budgetField.dataset.label || "this page";
      const unit = root.lang === "en" ? " KB" : " КБ";
      budgetField.textContent = `${label}: ${Math.round(total / 1024)}${unit}`;
    }
  });
}

/* Командная палитра. */
const palette = document.querySelector(".js-palette");
const paletteInput = document.querySelector(".js-palette-input");
const paletteItems = palette ? [...palette.querySelectorAll(".palette__item")] : [];
let activeIndex = 0;

function visibleItems() {
  return paletteItems.filter((item) => !item.hidden);
}

function selectItem(index) {
  const items = visibleItems();

  if (!items.length) {
    return;
  }

  activeIndex = (index + items.length) % items.length;
  paletteItems.forEach((item) => item.setAttribute("aria-selected", "false"));
  items[activeIndex].setAttribute("aria-selected", "true");
  items[activeIndex].scrollIntoView({ block: "nearest" });
}

function filterPalette() {
  const query = paletteInput.value.trim().toLowerCase();

  paletteItems.forEach((item) => {
    item.hidden = query !== "" && !item.textContent.toLowerCase().includes(query);
  });

  palette.querySelectorAll(".palette__group").forEach((group) => {
    let sibling = group.nextElementSibling;
    let hasVisible = false;

    while (sibling && !sibling.classList.contains("palette__group")) {
      hasVisible ||= !sibling.hidden;
      sibling = sibling.nextElementSibling;
    }

    group.hidden = !hasVisible;
  });

  selectItem(0);
}

function copyEmail(item) {
  const link = document.querySelector('a[href^="mailto:"]');
  const email = link?.getAttribute("href")?.replace("mailto:", "") ?? "";
  const label = item.querySelector("span");
  const original = label.textContent;

  navigator.clipboard?.writeText(email).catch(() => {});
  label.textContent = item.dataset.copied || original;
  setTimeout(() => {
    label.textContent = original;
  }, 1200);
}

function openPalette() {
  palette.showModal();
  paletteInput.value = "";
  filterPalette();
  paletteInput.focus();
}

function runAction(item) {
  const action = item?.dataset.action;

  if (action === "navigate") {
    window.location.href = item.dataset.href;
  } else if (action === "theme") {
    palette.close();
    document.querySelector(".js-theme-toggle").click();
  } else if (action === "copy") {
    copyEmail(item);
  } else if (action === "print") {
    palette.close();
    const isEnglish = root.lang === "en";
    window.location.href = `${isEnglish ? "/en/cv/" : "/cv/"}?print`;
  }
}

/* Печать резюме: палитра ведёт на /cv/?print, страница сама вызывает диалог. */
if (new URLSearchParams(window.location.search).has("print")) {
  window.addEventListener("load", () => window.print());
}

if (palette) {
  document.querySelectorAll(".js-palette-open").forEach((button) => {
    button.addEventListener("click", openPalette);
  });

  paletteInput.addEventListener("input", filterPalette);

  palette.addEventListener("keydown", (event) => {
    const items = visibleItems();

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

  paletteItems.forEach((item) => {
    item.addEventListener("click", () => runAction(item));
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      palette.open ? palette.close() : openPalette();
    }
  });
}
