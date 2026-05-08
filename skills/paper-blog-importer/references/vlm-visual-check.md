# VLM Visual Check

Run for every imported slug:

```bash
npm run verify:visual -- --slug <slug>
```

The script writes:

```text
tmp/visual-check/<slug>/
```

It includes desktop and mobile screenshots for English and Chinese article pages plus `vlm-prompt.md`.

## VLM Role

The VLM is a reviewer, not a writer. It should compare source-reference screenshots from the paper repo with generated website screenshots and return only structural issues. Do not accept prose rewrites from VLM output.

Ask it to check:

- heading hierarchy mismatch
- missing or reordered figures/tables
- figure/table captions not adjacent to the right visual
- double-figure, four-figure, grid, or flex layout broken
- formula number/tag missing or out of order
- small card/stat/download block lost
- paper/slides/poster download cards visible and clickable-looking
- appendix/reference content missing
- P1/P2 previous/next footer cards present
- obvious horizontal overflow or unreadable table/formula
- title sizes and right-side TOC not visually overwhelming the content

## Homepage Visual Check

After imports that change the article set, also inspect the homepage screenshot or browser view:

- P1 appears before P2 when both belong to the same paper.
- Deleted placeholder posts are gone.
- Pinned rail reflects `pinned: true` posts.
- Topics and search placeholder use current tags only.
- My Papers / Open Source / Reading Notes navigation lands on real sections or clear empty states.
- Asset URLs should load under the current deployed base/domain; if they do not, report it as an importer/link issue rather than changing domain configuration inside the import task.

Fix issues by changing importer rules, sidecar metadata, source draft, or CSS, then reimport/rebuild.
