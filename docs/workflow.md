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
  blogs.md
  blogs.zh.md
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
slug: moe-surpass-dense
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

## Comments

Comments will use Giscus. Giscus embeds GitHub Discussions on each post page, so each article can have a discussion-backed comment thread without running a custom database or backend.

## Search

Search will use Pagefind. Pagefind builds a static search index from the generated site, so the published site can search posts without a server.

