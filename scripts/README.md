# Scripts

## `import-draft.mjs`

Generic bilingual Markdown importer for paper/project drafts. It is program based: the script splits, copies, rewrites paths, adds frontmatter, and validates assets. LLMs should not rewrite the body text during import.

```bash
npm run import:draft -- /path/to/paper-project/blog.md
```

The first supported source format is one Markdown file with both language sections:

```markdown
## I. English Draft

...

## II. 中文稿

...
```

The importer writes:

```text
src/content/post/en/<slug>.mdx
src/content/post/zh/<slug>.mdx
public/assets/papers/<slug>/
public/assets/papers/<slug>/import-report.json
```

Current command for the ICLR 2026 Oral post:

```bash
npm run import:draft -- /Users/jyxc-dz-0100301/Documents/项目文档/paper/iclr2026/blog.md
```

### Mechanical Preservation

The script keeps Markdown, raw HTML blocks, tables, figures, captions, appendices, references, and KaTeX math in the generated article body. It only applies mechanical transformations needed by the site:

- Split English and Chinese sections.
- Promote source `###` headings to page-local `##` headings.
- Rewrite local asset references to `/houyi-blogs/assets/papers/<slug>/...`.
- Copy referenced `blog_assets/`, `reform_datas/`, and `references/` files.
- Normalize raw HTML for MDX parsing, for example `<img>` self-closing and `style="..."` to equivalent JSX `style={{ ... }}` objects.

### Import Report

Each run writes `import-report.json` with:

- Source hash, language-section hashes, and output hashes.
- Output paths.
- Counts for images, tables, figures, figcaptions, display math, equation tags, raw HTML blocks, and headings.
- Referenced, copied, and missing assets.
- Local absolute path leak checks.

The importer exits nonzero if an asset is missing or a generated post leaks a local absolute path.

### Reimport Cost

If the source draft changes by one sentence, rerun:

```bash
npm run import:draft -- /path/to/paper-project/blog.md
npm run build
```

The generated bilingual posts and article asset directory are overwritten. No LLM rewrite or manual copy is required.
