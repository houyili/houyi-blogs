# Import Contract

## Supported Sources

`source_format: single-bilingual`

- Command normally receives `/path/to/blog.md`.
- The sidecar is `/path/to/blog.import.yaml` unless `--config` is provided.
- The source is split using `sections.en_marker` and `sections.zh_marker`.

`source_format: paired-bilingual`

- The sidecar provides `sources.en` and `sources.zh`.
- Paths are resolved relative to the sidecar YAML.

## Sidecar YAML v1

Required fields:

```yaml
slug: paper-slug
published: "2026-05-07"
updated: "2026-05-07"
pinned: true
paper: true
project: paper-slug
venue: ICLR 2026
venue_type: Oral
paper_url: ""
image: /assets/papers/paper-slug/path/to/cover.png
source_format: single-bilingual
sections:
  en_marker: "^## I\\. English Draft\\s*$"
  zh_marker: "^## II\\. 中文稿.*$"
posts:
  en:
    title: English title
    description: English description
    category: Paper Explainer
    read_time: 45 min read
    tags: [MoE, Scaling Law]
  zh:
    title: 中文标题
    description: 中文描述
    category: 论文解读
    read_time: 45 分钟
    tags: [MoE, Scaling Law]
asset_roots: [blog_assets, reform_datas, references]
```

For paired bilingual sources, replace `sections` with:

```yaml
source_format: paired-bilingual
sources:
  en: blog.en.md
  zh: blog.zh.md
```

## Program-Based Transformations

Allowed mechanical changes:

- Split language sections.
- Promote source `###` headings to article-local `##`.
- Normalize display math so KaTeX treats `\tag{}` as display math.
- Rewrite local assets to `/houyi-blogs/assets/papers/<slug>/...`.
- Copy assets from configured `asset_roots`.
- Convert raw HTML to MDX-safe syntax without changing layout intent, such as self-closing `<img />` and JSX style objects.

Do not rewrite prose, reorder figures, rebuild tables, collapse appendices, or replace raw HTML layouts by hand.

## Content Verification

The import report must be treated as the programmatic source of truth. A publishable import has:

- no missing assets
- no local absolute path leaks
- no feature count mismatches for images, tables, figures, figcaptions, display math, equation tags, or raw HTML blocks
- matching normalized text hashes

If these checks fail, fix the importer or sidecar, then rerun the import.
