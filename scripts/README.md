# Scripts

## `import-draft.mjs`

Generic bilingual Markdown importer for paper/project drafts. It is program based: the script splits, copies, rewrites paths, adds frontmatter, and validates assets. LLMs should not rewrite the body text during import.

```bash
npm run import:draft -- /path/to/paper-project/blog.md
```

The importer supports one Markdown file with both language sections:

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

It also supports paired files with a sidecar config:

```yaml
source_format: paired-bilingual
sources:
  en: blog.en.md
  zh: blog.zh.md
```

Example command for a paper body post:

```bash
npm run import:draft -- /path/to/paper-repo/blog_body.md --config scripts/fixtures/<paper-slug>-p1.import.yaml
```

If no `--config` is passed, the importer looks for `<basename>.import.yaml` beside the source draft. If it does not exist, it creates a template and exits so the metadata can be filled once.

### Mechanical Preservation

The script keeps Markdown, raw HTML blocks, tables, figures, captions, appendices, references, and KaTeX math in the generated article body. It only applies mechanical transformations needed by the site:

- Split English and Chinese sections.
- Promote source `###` headings to page-local `##` headings.
- Rewrite local asset references to `/assets/papers/<slug>/...`.
- Copy referenced `blog_assets/`, `reform_datas/`, and `references/` files.
- Normalize raw HTML for MDX parsing, for example `<img>` self-closing and `style="..."` to equivalent JSX `style={{ ... }}` objects.

### Import Report

Each run writes `import-report.json` with:

- Source hash, language-section hashes, and output hashes.
- Normalized source/generated text hashes.
- Output paths.
- Counts for images, tables, figures, figcaptions, display math, equation tags, raw HTML blocks, and headings.
- Referenced, copied, and missing assets.
- Local absolute path leak checks.

The importer exits nonzero if an asset is missing, a generated post leaks a local absolute path, feature counts mismatch, or normalized text hashes diverge.

### Verification

```bash
npm run verify:import -- --slug moe-equal-resources-p1
npm run verify:visual -- --slug moe-equal-resources-p1
```

`verify:visual` writes screenshots and a VLM review prompt under `tmp/visual-check/<slug>/`.

### Skill Install

```bash
npm run skill:install
```

This symlinks `skills/paper-blog-importer` into `${CODEX_HOME:-~/.codex}/skills/paper-blog-importer`. Existing symlinks from older clones are automatically relinked; real files/directories are not overwritten.

```bash
npm run skill:self-test
```

This runs the repo-contained cross-machine smoke test for install, relink, required files, referenced files, and local path leaks.

### Reimport Cost

If the source draft changes by one sentence, rerun:

```bash
npm run import:draft -- /path/to/paper-project/blog.md
npm run build
```

The generated bilingual posts and article asset directory are overwritten. No LLM rewrite or manual copy is required.
