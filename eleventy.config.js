/**
 * Конфигурация 11ty.
 * Задача конфига — только склейка шаблонов и копирование ассетов.
 * CSS и JS не собираются и не минифицируются: они лежат готовыми файлами.
 */
import * as yaml from "js-yaml";

export default function (eleventyConfig) {
  // YAML-данные: в 11ty 3 поддержка вынесена из ядра, регистрируем сами
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

  // Ассеты копируются как есть: src/assets/css/styles.css -> /css/styles.css
  eleventyConfig.addPassthroughCopy({ "src/assets": "." });

  // Идентификатор сборки для кэш-бастинга (?v=...)
  eleventyConfig.addGlobalData("build", () => ({ id: Date.now().toString(36) }));

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
