import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export default defineConfig({
  site: "https://houyi.blog",
  base: "/",
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          zh: "zh"
        }
      },
      filter(page) {
        return page !== "https://houyi.blog/";
      },
      serialize(item) {
        const path = new URL(item.url).pathname;
        const isHome = path === "/" || path === "/en/" || path === "/zh/";
        const isPost = /^\/(?:en|zh)\/moe-equal-resources-p[12]\/$/.test(path);

        item.lastmod = new Date().toISOString();
        item.changefreq = isPost ? "monthly" : "weekly";
        item.priority = isHome ? 1.0 : isPost ? 0.9 : 0.7;

        return item;
      }
    })
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: "github-light"
    }
  }
});
