import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://houyili.github.io",
  base: "/houyi-blogs",
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});

