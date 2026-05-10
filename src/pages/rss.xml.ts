import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const site = "https://houyi.blog";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async () => {
  const posts = await getCollection("post", ({ data }) => !data.draft);
  const items = posts
    .sort((a, b) => {
      const dateDiff = b.data.published.valueOf() - a.data.published.valueOf();
      if (dateDiff !== 0) return dateDiff;
      return a.data.post_slug.localeCompare(b.data.post_slug);
    })
    .map((post) => {
      const url = `${site}/${post.data.lang}/${post.data.post_slug}/`;
      const categories = post.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("");

      return `<item>
  <title>${escapeXml(post.data.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="true">${url}</guid>
  <description>${escapeXml(post.data.description)}</description>
  <pubDate>${post.data.published.toUTCString()}</pubDate>
  <author>lihouyi2013@hotmail.com (Houyi Li)</author>
  ${categories}
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Houyi AI Research Flow</title>
  <link>${site}/</link>
  <description>AGI research learning notes and work explainers by Houyi Li.</description>
  <language>en</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
};
