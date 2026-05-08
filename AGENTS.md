# Repository Guidelines

## Project Structure & Module Organization

This is an Astro 5 static site for bilingual AI research posts. Core code lives in `src/`: routes in `src/pages/`, UI in `src/components/`, layouts in `src/layouts/`, global styles in `src/styles/global.css`, and content schema in `src/content/config.ts`. Posts are paired MDX files in `src/content/post/en/` and `src/content/post/zh/`. Static files and imported paper assets live in `public/`, especially `public/assets/papers/<slug>/`. Import utilities are in `scripts/`; reusable agent workflow instructions are in `skills/paper-blog-importer/`. Do not commit `dist/`, `.astro/`, `node_modules/`, or `tmp/`.

## Build, Test, and Development Commands

- `npm install`: install site and verification dependencies.
- `npm run dev`: start Astro locally.
- `npm run check`: run Astro and TypeScript checks.
- `npm run build`: build the static site into `dist/` and generate the Pagefind index.
- `npm run preview`: serve the built site locally.
- `npm run import:draft -- /path/to/blog.md --config scripts/fixtures/<slug>.import.yaml`: import bilingual drafts into MDX and copy assets.
- `npm run verify:import -- --slug <slug>` and `npm run verify:visual -- --slug <slug>`: validate imports and create screenshots under `tmp/visual-check/<slug>/`.

## Coding Style & Naming Conventions

Use ES modules, double quotes in JavaScript/TypeScript/Astro frontmatter, and two-space indentation in Astro templates and JSON. Keep route and content slugs lowercase kebab-case, for example `moe-equal-resources-p1`. Keep bilingual post pairs aligned by `post_slug`, `translation`, and shared asset directories. Prefer deterministic script changes when import behavior changes.

## Testing Guidelines

There is no separate unit-test suite yet. For site or script changes, run `npm run check` and `npm run build`. For importer changes or new posts, also run `npm run verify:import -- --slug <slug>`; use `npm run verify:visual -- --slug <slug>` when layout, MDX rendering, figures, tables, math, or asset paths may change.

## Commit & Pull Request Guidelines

Recent commits use short, imperative, capitalized subjects such as `Add bilingual draft importer` and `Refresh MoE blog import`. Keep commits focused by workflow or feature. Pull requests should include a summary, verification commands, linked issue or source draft when relevant, and screenshots for visual changes or new posts. Do not include `.env`, local absolute paths, generated screenshots, or build output.

## Agent-Specific Instructions

For imports, preserve source prose and structure. Let `scripts/import-draft.mjs` handle splitting, path rewriting, asset copying, and report generation; do not rewrite article bodies manually unless explicitly requested. Review `public/assets/papers/<slug>/import-report.json` before publishing imported content.

## Product Model

The public site is an AGI research flow, not a documentation taxonomy site. Keep the first-level navigation centered on streams of posts:

- `AGI Flow` shows every published post.
- `My Papers` shows posts with `paper: true`.
- `Open Source` shows posts with `paper: false` and a non-empty `project`.
- `Reading Notes` shows posts with `paper: false` and no `project`.

Every stream page uses the same ordering: pinned posts first, then newest published date first, then `post_slug` ascending for deterministic ties. Empty streams should render a quiet empty state in the main flow instead of secondary bottom cards.

The right rail keeps `Search`, `Pinned`, and `Topics`. `Topics` is derived from the tags in the current stream only and is intended as the tag-filter entry point.

Language switching is semantic and global. Stream pages switch to the corresponding stream in the other language, for example `/en/papers/` to `/zh/papers/`. Post pages switch to the translated post from frontmatter `translation`, for example `/en/<slug>/` to `/zh/<slug>/`, not back to a home page.
