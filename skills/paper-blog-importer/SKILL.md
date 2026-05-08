---
name: paper-blog-importer
description: Use when Codex needs to import paper/project Markdown drafts into the Houyi Blog Astro site as bilingual posts, including long-paper P1/P2 splits, asset/download migration, KaTeX math, raw HTML layout preservation, import reports, VLM review, or reimporting without hand-copying prose.
---

# Paper Blog Importer

## Core Rule

Use the repository importer as the source of truth. Do not rewrite article prose, manually rebuild HTML, or hand-copy assets. LLM context is allowed only for metadata assistance, failure diagnosis, source sanity checks, and suggestions for importer/CSS fixes.

Do not change deployment ownership while importing. `astro.config.mjs`, `public/CNAME`, GitHub Pages settings, and domain/DNS choices are outside this skill unless the user explicitly asks for deployment changes. The importer reads the current Astro base path and should adapt generated links to it.

## Runbook

1. Work in the `houyi-blogs` repository and inspect the source draft shape:
   - single bilingual: `blog.md`, `blog_body.md`, or `blog_appendix.md` with language markers
   - paired bilingual: `blog.en.md` + `blog.zh.md`
2. Read `references/import-contract.md` before creating or changing sidecar YAML.
3. Create/update the sidecar YAML. Put all metadata there: `slug`, titles, descriptions, tags, pinned state, cover image, asset roots, `hide_description_in_header`, and optional `footer_nav`.
4. Sanity-check source sections before import:
   - English section has English subtitle/download card text.
   - Chinese section has Chinese subtitle/download card text.
   - Download links and raw HTML `<a href>` point to local files or intended external URLs.
   - Tags/categories match the current publication plan.
5. Import from source, never by editing generated MDX:

```bash
npm run import:draft -- /path/to/blog.md --config scripts/fixtures/<slug>.import.yaml
```

6. Verify each slug:

```bash
npm run verify:import -- --slug <slug>
ASTRO_TELEMETRY_DISABLED=1 npm run check
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm run verify:visual -- --slug <slug>
```

7. Inspect build output for regressions:
   - expected routes exist for `/en/<slug>/` and `/zh/<slug>/`
   - removed old slugs are absent from `dist/`
   - homepage cards, pinned rail, topics, and search placeholder are generated from the current posts
   - no stale placeholder posts remain
   - asset links match the current deployment base; do not fix this by changing domain config unless explicitly requested
8. If anything fails, fix importer rules, sidecar metadata, source draft, or site CSS, then rerun import. Do not patch generated article bodies.

## Long Paper Split Pattern

For a long paper, prefer separate slugs such as `<paper>-p1` and `<paper>-p2`. Read `references/split-body-appendix.md` when the user wants a main-body post plus an appendix post.

- P1 body: usually `pinned: true`, category `Paper Explainer · P1` / `论文解读 · P1`.
- P2 appendix: usually `pinned: false`, category `Appendix · P2` / `附录 · P2`.
- Keep shared title/subtitle/tags/venue/project id across P1 and P2 unless the user asks otherwise.
- Preserve source numbering across the pair; never renumber figures, tables, formulas, appendices, or references.
- Add P1 -> P2 and P2 -> P1 links through `footer_nav`, not by editing generated MDX.
- Remove old single-post artifacts and stale placeholders in the same import change when replacing a previous one-piece article.
- Run import/verify/build/visual checks for both slugs, then inspect homepage ordering, pinned rail, topics, and search placeholder.

## References

- `references/import-contract.md`: sidecar YAML schema, split markers, asset/download behavior, and allowed mechanical transformations.
- `references/split-body-appendix.md`: reusable playbook for splitting one long paper blog into P1 body and P2 appendix.
- `references/vlm-visual-check.md`: screenshot package and VLM review checklist.

## Expected Outputs

- `src/content/post/en/<slug>.mdx`
- `src/content/post/zh/<slug>.mdx`
- `public/assets/papers/<slug>/...`
- `public/assets/papers/<slug>/import-report.json`

Minor prose edits should cost one reimport command plus verification, not a manual migration.
