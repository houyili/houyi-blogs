---
name: paper-blog-importer
description: Program-based workflow for importing paper/project repository Markdown drafts into the Houyi Blog Astro site with bilingual posts, asset migration, KaTeX math, raw HTML layout preservation, import reports, and VLM visual review. Use when Codex needs to turn blog.md, blog.en.md/blog.zh.md, or paper repo Markdown into published Houyi Blog article pages without hand-copying or rewriting prose.
---

# Paper Blog Importer

## Core Rule

Use the repository importer as the source of truth. Do not rewrite article prose, manually rebuild HTML, or hand-copy assets. LLM context is allowed only for metadata assistance, failure diagnosis, and suggestions for importer/CSS fixes.

## Workflow

1. Work in the `houyi-blogs` repository.
2. Inspect the paper repo draft format:
   - single bilingual file: `blog.md` with `## I. English Draft` and `## II. 中文稿`
   - paired bilingual files: `blog.en.md` and `blog.zh.md`
3. Create or update the sidecar YAML near the draft, or pass an explicit config with `--config`.
4. Import with:

```bash
npm run import:draft -- /path/to/blog.md
```

or:

```bash
npm run import:draft -- --config /path/to/blog.import.yaml
```

5. Verify content:

```bash
npm run verify:import -- --slug <slug>
npm run check
npm run build
```

6. Generate visual review artifacts:

```bash
npm run verify:visual -- --slug <slug>
```

7. If verification fails, fix importer rules, sidecar metadata, or site CSS. Reimport instead of editing generated article bodies by hand.

## References

- Read `references/import-contract.md` when creating or editing sidecar YAML, importer behavior, or content verification rules.
- Read `references/vlm-visual-check.md` when generating screenshots or asking a VLM to review visual preservation.

## Expected Outputs

- `src/content/post/en/<slug>.mdx`
- `src/content/post/zh/<slug>.mdx`
- `public/assets/papers/<slug>/...`
- `public/assets/papers/<slug>/import-report.json`

The reimport cost for minor prose changes should remain one import command plus build verification.
