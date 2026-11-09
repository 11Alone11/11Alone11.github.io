# Сайт-портфолио

Статический сайт: 11ty для шаблонов, дальше — чистый HTML, CSS по БЭМ и один JS-файл.
Без сборщиков, без минификации: исходник читается в DevTools и это осознанно.

## Команды

```bash
npm ci          # установить зависимости
npm run build   # собрать в _site
npm run serve   # локальный сервер с пересборкой
```

## Структура

```
src/
├─ _data/            данные: сайт, навигация, кейсы
├─ _includes/        макеты и партиалы Nunjucks
├─ assets/css/       styles.css — единственный файл стилей
├─ assets/js/        main.js — единственный файл скриптов
├─ assets/fonts/     Literata + Inter, subset woff2
├─ index.njk         главная
└─ 404.njk
```

## Деплой

Push в `main` → GitHub Actions собирает и публикует на GitHub Pages.
