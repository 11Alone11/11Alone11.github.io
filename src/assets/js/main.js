const root = document.documentElement;
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------- theme */

const themeButton = document.querySelector(".js-theme-toggle");
const THEME_KEY = "theme";

function syncThemeButton() {
  if (!themeButton) return;
  const isDark = root.dataset.theme === "dark";
  themeButton.setAttribute(
    "aria-label",
    isDark ? "Включить светлую тему" : "Включить тёмную тему"
  );
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    /* приватный режим: тема не запомнится */
  }
  syncThemeButton();
}

function toggleTheme(event) {
  const next = root.dataset.theme === "dark" ? "light" : "dark";

  if (!document.startViewTransition || reduceMotion()) {
    applyTheme(next);
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  root.style.setProperty("--theme-x", `${rect.left + rect.width / 2}px`);
  root.style.setProperty("--theme-y", `${rect.top + rect.height / 2}px`);
  document.startViewTransition(() => applyTheme(next));
}

syncThemeButton();
themeButton?.addEventListener("click", toggleTheme);

/* ------------------------------------------------------------- header + progress */

const header = document.querySelector(".js-header");
const progress = document.querySelector(".js-progress");
let scrollScheduled = false;

function updateScrollUi() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;

  header?.classList.toggle("is-scrolled", y > 8);

  if (progress) {
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
  }

  scrollScheduled = false;
}

function requestScrollUpdate() {
  if (scrollScheduled) return;
  scrollScheduled = true;
  window.requestAnimationFrame(updateScrollUi);
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
updateScrollUi();

/* ---------------------------------------------------------------- reveal */

const revealItems = [...document.querySelectorAll("[data-reveal]")];

if (revealItems.length) {
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}

/* ---------------------------------------------------------------- reel */

for (const reel of document.querySelectorAll(".js-reel")) {
  const slides = [...reel.querySelectorAll(".reel__slide")];
  const dots = [...reel.querySelectorAll(".reel__dot")];
  const stage = reel.querySelector(".reel__stage");
  let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
  let startX = null;
  let startY = null;
  let swiped = false;

  if (!slides.length) continue;

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.tabIndex = active ? 0 : -1;
    });

    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  reel.querySelector(".js-reel-prev")?.addEventListener("click", () => show(index - 1));
  reel.querySelector(".js-reel-next")?.addEventListener("click", () => show(index + 1));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => show(Number(dot.dataset.goto)));
  });

  reel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    }
  });

  stage?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    startX = event.clientX;
    startY = event.clientY;
  });

  stage?.addEventListener("pointerup", (event) => {
    if (startX === null || startY === null) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = null;
    startY = null;

    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

    swiped = true;
    window.setTimeout(() => {
      swiped = false;
    }, 320);
    show(dx > 0 ? index - 1 : index + 1);
  });

  stage?.addEventListener("pointercancel", () => {
    startX = null;
    startY = null;
  });

  reel.addEventListener(
    "click",
    (event) => {
      if (!swiped) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  show(index);
}

/* ---------------------------------------------------------------- compare */

for (const block of document.querySelectorAll(".js-compare")) {
  const range = block.querySelector(".js-compare-range");

  if (!range) continue;

  const update = () => {
    const value = Number(range.value);
    block.style.setProperty("--pos", `${value}%`);
    range.setAttribute(
      "aria-valuetext",
      `${value} процентов — слева старый сайт, справа новый`
    );
  };

  range.addEventListener("input", update);
  update();
}

/* ---------------------------------------------------------------- lightbox */

const lightbox = document.querySelector(".js-lightbox-dialog");

if (lightbox) {
  const image = lightbox.querySelector(".js-lightbox-img");
  const caption = lightbox.querySelector("#lightbox-caption");
  const counter = lightbox.querySelector(".js-lightbox-counter");
  const closeButton = lightbox.querySelector(".js-lightbox-close");
  const prevButton = lightbox.querySelector(".js-lightbox-prev");
  const nextButton = lightbox.querySelector(".js-lightbox-next");
  const triggers = [...document.querySelectorAll(".js-lightbox")];
  const groups = new Map();

  let items = [];
  let index = 0;
  let opener = null;
  let closing = false;

  for (const trigger of triggers) {
    const group = trigger.dataset.group || "default";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(trigger);
  }

  function render() {
    const item = items[index];
    if (!item) return;

    const source = item.getAttribute("href");
    const alt = item.dataset.caption || "";

    image.src = source;
    image.alt = alt;
    if (caption) caption.textContent = alt;
    counter.textContent = `${index + 1} / ${items.length}`;

    const many = items.length > 1;
    if (prevButton) prevButton.hidden = !many;
    if (nextButton) nextButton.hidden = !many;

    const neighbour = items[(index + 1) % items.length];
    if (many && neighbour && neighbour !== item) {
      const preload = new Image();
      preload.src = neighbour.getAttribute("href");
    }
  }

  function open(trigger) {
    opener = trigger;
    items = groups.get(trigger.dataset.group || "default") || [];
    index = Math.max(0, items.indexOf(trigger));
    closing = false;
    lightbox.classList.remove("is-closing");

    render();
    lightbox.showModal();
    document.body.classList.add("is-locked");
    closeButton?.focus();
  }

  function step(delta) {
    if (items.length < 2) return;
    index = (index + delta + items.length) % items.length;
    render();
  }

  function close() {
    if (closing || !lightbox.open) return;
    closing = true;
    lightbox.classList.add("is-closing");

    window.setTimeout(() => {
      lightbox.close();
      lightbox.classList.remove("is-closing");
      document.body.classList.remove("is-locked");
      closing = false;
      opener?.focus();
    }, 190);
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(trigger);
    });
  });

  closeButton?.addEventListener("click", close);
  prevButton?.addEventListener("click", () => step(-1));
  nextButton?.addEventListener("click", () => step(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  lightbox.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  });
}

/* ---------------------------------------------------------------- print */

document.querySelectorAll(".js-print").forEach((button) => {
  button.addEventListener("click", () => window.print());
});

/* ---------------------------------------------------------------- scrollspy */

const navLinks = [...document.querySelectorAll(".nav__link")];
const sectionIds = ["work", "experience", "contact"];
const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if (navLinks.length && sections.length && "IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navLinks.forEach((link) => {
          const href = link.getAttribute("href");
          const active = href === `#${entry.target.id}` || href === `/#${entry.target.id}`;
          if (active) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      }
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach((section) => spy.observe(section));
}
