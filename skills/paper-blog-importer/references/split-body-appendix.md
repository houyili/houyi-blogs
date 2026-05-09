# Split Body + Appendix Import Playbook

Use this when one long paper blog should become two public posts: P1 main body and P2 appendix. The goal is to keep the source Markdown authoritative and make the split repeatable by config and importer rules.

## Source Shape

Preferred source files:

```text
paper-repo/
  blog_body.md
  blog_appendix.md
```

Each file can still be single-file bilingual. Typical markers:

- body English: `^## I\. English Draft\s*$`
- body Chinese: `^## II\. 中文稿.*$`
- appendix English: `^## I-A\. English Appendix\s*$`
- appendix Chinese: `^## II-A\. 中文附录\s*$`

Do not merge body and appendix in the blog repo by hand. Import each source file through its own sidecar config.

## Config Pair Pattern

Create two configs, usually under `scripts/fixtures/` or beside the source draft:

```text
<paper-slug>-p1.import.yaml
<paper-slug>-p2.import.yaml
```

P1:

```yaml
slug: <paper-slug>-p1
pinned: true
paper: true
project: <paper-slug>
hide_description_in_header: true
posts:
  en:
    category: Paper Explainer · P1
  zh:
    category: 论文解读 · P1
footer_nav:
  en:
    next: { label: Next, title: Appendix (P2), href: en/<paper-slug>-p2/ }
  zh:
    next: { label: 下一篇, title: 附录（P2）, href: zh/<paper-slug>-p2/ }
```

P2:

```yaml
slug: <paper-slug>-p2
pinned: false
paper: true
project: <paper-slug>
hide_description_in_header: true
posts:
  en:
    category: Appendix · P2
  zh:
    category: 附录 · P2
footer_nav:
  en:
    previous: { label: Previous, title: Main text (P1), href: en/<paper-slug>-p1/ }
  zh:
    previous: { label: 上一篇, title: 正文（P1）, href: zh/<paper-slug>-p1/ }
```

Use the same main title, subtitle/description, tags, venue, and project id across P1 and P2 unless the user asks otherwise. P1 should usually be pinned and P2 should not; that makes the homepage show P1 before P2 and keeps the pinned rail focused on the main article.

If P2 needs a different homepage thumbnail, prefer a source-side thumbnail/crop and `image_source`:

```yaml
image: ""
image_source: blog_assets/<appendix-card-thumbnail>.png
```

The thumbnail file must live under `asset_roots`, so it is copied on every import. Do not hand-copy card images into `public/assets/papers/...`; that directory is regenerated.

## Shared Numbering And Download Cards

When the source deliberately uses continuous numbering across body and appendix, preserve it exactly:

- Do not renumber figures, tables, equations, sections, or appendices.
- Do not split or rebuild raw HTML figure grids by hand.
- Keep `\tag{}` equation numbers in source; let KaTeX render them.
- Treat duplicate-looking subtitles/download cards as source-owned layout. Use `hide_description_in_header: true` so the layout does not duplicate the subtitle above the imported block.
- If both P1 and P2 include Paper / Slides / Poster cards, both configs need `asset_roots` covering the same local download files.
- Download cards should get the importer-generated `download-card` class and display the shared CSS download icon in both P1 and P2.

Typical asset roots for paper launches:

```yaml
asset_roots:
  - blog_assets
  - reform_datas
  - references
  - camera_ready.pdf
  - Final vision
  - Final%20vision
```

Include both decoded and URL-encoded directory spellings when the source links contain spaces, such as `Final%20vision/...`, while the filesystem directory is `Final vision/...`.

## Replacing An Old Single Post

When splitting an existing one-piece article:

1. Delete old generated MDX in both languages.
2. Delete the old asset directory.
3. Delete the old import fixture/config.
4. Remove any placeholder post that should not remain in the homepage flow.
5. Import P1 and P2 from source configs.
6. Verify old routes are absent from `dist/` and sitemap after build.

Do not keep a stale one-piece post unless the user explicitly wants a redirect/archive page.

## Pair-Level Verification

Run slug-level checks for both posts:

```bash
npm run import:draft -- /path/to/blog_body.md --config scripts/fixtures/<paper-slug>-p1.import.yaml
npm run import:draft -- /path/to/blog_appendix.md --config scripts/fixtures/<paper-slug>-p2.import.yaml
npm run verify:import -- --slug <paper-slug>-p1
npm run verify:import -- --slug <paper-slug>-p2
ASTRO_TELEMETRY_DISABLED=1 npm run check
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm run verify:visual -- --slug <paper-slug>-p1
npm run verify:visual -- --slug <paper-slug>-p2
```

Then inspect pair behavior:

- If the skill, installer, or visual verifier changed, `npm run skill:self-test` passes before publishing.
- `/en/<paper-slug>-p1/`, `/zh/<paper-slug>-p1/`, `/en/<paper-slug>-p2/`, `/zh/<paper-slug>-p2/` exist.
- P1 footer links to P2; P2 footer links back to P1.
- P1 appears before P2 on the homepage.
- Pinned rail contains P1, not P2.
- Topics count both posts and only current tags.
- Search placeholder is generated from current tags, not deleted placeholders.
- Paper / Slides / Poster links exist and point to copied assets.
- Paper / Slides / Poster cards show a download icon/affordance.
- No generated MDX contains local absolute paths.
- Removed old slugs and placeholder posts are absent from `dist/` and sitemap.

For VLM review, judge P1 and P2 as one logical article split into two web pages. The VLM should report missing structure, broken figure/table grids, lost cards, missing equation tags, incorrect footer cards, and homepage ordering issues. It should not rewrite prose.
