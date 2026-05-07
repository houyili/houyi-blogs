# Blog Workflow

## Repository Roles

`houyili.github.io` remains the personal homepage.

`houyi-blogs` is the independent AI/AGI blog repository and deploys to:

```text
https://houyili.github.io/houyi-blogs/
```

## Draft-To-Publish Flow

Paper and project repositories own drafts and source material:

```text
paper-project/
  blog.md
  figures/
  tables/
  paper.pdf
```

This blog repository owns the public presentation:

```text
src/content/post/en/
src/content/post/zh/
public/assets/
```

## Metadata Format

Every imported post should use the same frontmatter shape:

```yaml
title: "How to Train an MoE Model That Surpasses Dense Models"
description: "A research explanation of data, routing, and scaling tradeoffs."
published: 2026-05-02
updated: 2026-05-02
lang: en
post_slug: moe-surpass-dense
translation: zh/moe-surpass-dense
tags:
  - MoE
  - Scaling Law
  - Data Reuse
pinned: true
paper: true
project: moe-surpass-dense
source_project: "/path/to/paper/project"
source_draft: "blogs.md"
draft: false
```

The import tool should ask for missing metadata interactively, then copy the post and assets into the blog repository.

## Import Command

For the current ICLR 2026 Oral post:

```bash
npm run import:draft -- /Users/jyxc-dz-0100301/Documents/项目文档/paper/iclr2026/blog.md --config scripts/fixtures/moe-equal-resources.import.yaml
```

The import step is deterministic and program based. Codex may help diagnose failures or suggest metadata, but it should not rewrite the article body during import. For future paper repos, prefer a sidecar `blog.import.yaml` beside the source draft so metadata is filled once and reused across imports.

After import:

```bash
npm run verify:import -- --slug moe-equal-resources
npm run check
npm run build
```

## Content Completeness Checks

Every import creates:

```text
public/assets/papers/<slug>/import-report.json
```

Review this file before publishing. Acceptance criteria:

- `validation.missingAssets` is empty.
- `validation.localPathLeaks` is empty.
- Source and generated counts align for images, tables, figures, captions, display math, equation tags, and raw HTML blocks.
- Text differences are limited to documented mechanical changes: frontmatter, language split, heading promotion, references in both language outputs, asset URL rewrite, and JSX-safe raw HTML normalization.

## Visual/VLM Review

The visual source of truth remains the rendered source draft and the rendered website, not an LLM rewrite. For important posts:

1. Render source-reference screenshots from the paper project, or open the source Markdown in the preferred Markdown renderer and screenshot key sections.
2. Build this site and screenshot:
   - desktop English article
   - desktop Chinese article
   - mobile English article
   - mobile Chinese article
3. Ask a VLM to compare source-reference screenshots against website screenshots and return only a problem list.

Use this VLM checklist:

```text
Compare the source draft rendering and the website rendering.
Report only structural or preservation problems:
- heading hierarchy mismatch
- missing or reordered figures/tables
- figure/table captions not adjacent to the right visual
- double-figure or grid layout broken
- formula number/tag missing or out of order
- small card/stat block lost
- appendix/reference content missing
- obvious horizontal overflow or unreadable table/formula
Do not rewrite prose. Do not propose copy edits.
```

Fixes should be made in importer rules or CSS, then the post should be reimported.

## Codex Skill

This repo includes a reusable Codex skill for the workflow:

```bash
npm run skill:install
```

The installer symlinks `skills/paper-blog-importer` into `${CODEX_HOME:-~/.codex}/skills`. On another Mac, clone this repo, run `npm install`, then run the install command above.

## Comments

Comments will use Giscus. Giscus embeds GitHub Discussions on each post page, so each article can have a discussion-backed comment thread without running a custom database or backend.

## Search

Search will use Pagefind. Pagefind builds a static search index from the generated site, so the published site can search posts without a server.
