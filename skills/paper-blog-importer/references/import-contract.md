# Import Contract

## Supported Sources

`source_format: single-bilingual`

- Command receives `/path/to/blog.md`, `/path/to/blog_body.md`, or `/path/to/blog_appendix.md`.
- The sidecar is `/path/to/<basename>.import.yaml` unless `--config` is provided.
- Split with `sections.en_marker` and `sections.zh_marker`.
- Common markers:
  - body: `^## I\. English Draft\s*$` and `^## II\. 中文稿.*$`
  - appendix: `^## I-A\. English Appendix\s*$` and `^## II-A\. 中文附录\s*$`

`source_format: paired-bilingual`

- Sidecar provides `sources.en` and `sources.zh`.
- Paths resolve relative to the sidecar YAML.

## Sidecar YAML v1

```yaml
slug: paper-slug-p1
published: "2026-05-08"
updated: "2026-05-08"
pinned: true
paper: true
project: paper-slug
venue: ICLR 2026
venue_type: Oral
paper_url: ""
image: /assets/papers/paper-slug-p1/path/to/cover.png
hide_description_in_header: true
source_format: single-bilingual
sections:
  en_marker: '^## I\. English Draft\s*$'
  zh_marker: '^## II\. 中文稿.*$'
posts:
  en:
    title: English title
    description: English subtitle for cards/SEO
    category: Paper Explainer · P1
    read_time: 30 min read
    tags: [MoE, Pretrain, LLM, ICLR 2026 oral, Data Scaling, Data Reuse]
  zh:
    title: 中文标题
    description: 中文副标题，用于卡片和 SEO
    category: 论文解读 · P1
    read_time: 30 分钟
    tags: [MoE, Pretrain, LLM, ICLR 2026 oral, Data Scaling, Data Reuse]
footer_nav:
  en:
    next:
      label: Next
      title: Appendix (P2)
      href: en/paper-slug-p2/
  zh:
    next:
      label: 下一篇
      title: 附录（P2）
      href: zh/paper-slug-p2/
asset_roots:
  - blog_assets
  - reform_datas
  - references
  - camera_ready.pdf
  - Final vision
  - Final%20vision
```

For paired bilingual sources, replace `sections` with:

```yaml
source_format: paired-bilingual
sources:
  en: blog.en.md
  zh: blog.zh.md
```

## Metadata Rules

- Put tags in config, not generated MDX. Reimport must preserve them.
- Use the same tag set across en/zh unless there is a deliberate bilingual taxonomy change.
- `hide_description_in_header: true` prevents duplicate subtitles when the source body already contains a subtitle/download card block.
- `footer_nav` is the only supported way to add previous/next links to imported posts.
- If replacing a long old single post with split posts, delete the old generated MDX, old asset directory, and old fixture config in the same change.
- Do not change `astro.config.mjs`, `public/CNAME`, GitHub Pages settings, or DNS/domain configuration as part of an import. Treat deployment base/domain as an external project setting.

## Program-Based Transformations

Allowed mechanical changes:

- Split language sections.
- Promote source `###` headings to article-local `##`.
- Normalize display math so KaTeX treats `\tag{}` as display math.
- Rewrite local assets to `/assets/papers/<slug>/...`.
- The importer should derive any needed deployment prefix from the existing Astro config; sidecar YAML should stay portable and should not hard-code a domain-specific workaround.
- Copy assets from configured `asset_roots`.
- Rewrite raw HTML `<img src="...">` and `<a href="...">` local resources, including download links.
- Decode local URL-encoded paths such as `Final%20vision/...` for filesystem lookup, then keep safe URL encoding in generated routes.
- Convert raw HTML to MDX-safe syntax without changing layout intent, such as self-closing `<img />` and JSX style objects.

Do not rewrite prose, reorder figures, rebuild tables, collapse appendices, renumber formulas, or replace raw HTML layouts by hand.

## Source Sanity Checks Before Import

- English source section should not start with a Chinese subtitle unless intentionally bilingual.
- Chinese source section should not start with an English-only subtitle unless intentionally bilingual.
- Paper/slides/poster links should be present in both language sections when the publication plan includes download cards.
- P1/P2 posts should share title/subtitle and tags when they are parts of the same article.
- P1 should link to P2; P2 should link back to P1 through config-driven `footer_nav`.

## Content Verification

Treat `import-report.json` as the programmatic source of truth. A publishable import has:

- no missing assets
- no local absolute path leaks
- no feature count mismatches for images, tables, figures, figcaptions, display math, equation tags, or raw HTML blocks
- matching normalized text hashes
- expected download assets copied, for example paper PDF, slides PDF, and poster PDF

If checks fail, fix the importer, sidecar, source draft, or CSS, then rerun the import.

## Build/Route Regression Checks

After `npm run build`, check:

- expected new pages exist in `dist/en/<slug>/index.html` and `dist/zh/<slug>/index.html`
- intentionally removed old pages do not exist in `dist/`
- sitemap no longer lists removed slugs
- homepage rail uses current posts only: `All Research` count, Pinned, Topics, and Search placeholder should not mention deleted placeholders
- root `/` renders the English homepage, not a blank redirect shell
