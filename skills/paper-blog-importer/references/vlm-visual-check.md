# VLM Visual Check

Run:

```bash
npm run verify:visual -- --slug <slug>
```

The script builds a screenshot package under:

```text
tmp/visual-check/<slug>/
```

It includes desktop and mobile screenshots for English and Chinese article pages plus `vlm-prompt.md`.

## VLM Role

The VLM is a reviewer, not a writer. It should compare source-reference screenshots from the paper repo with generated website screenshots and return only structural issues.

Ask it to check:

- heading hierarchy mismatch
- missing or reordered figures/tables
- figure/table captions not adjacent to the right visual
- double-figure or grid layout broken
- formula number/tag missing or out of order
- small card/stat block lost
- appendix/reference content missing
- obvious horizontal overflow or unreadable table/formula

Do not accept prose rewrites from VLM output. Fix issues by changing importer rules or CSS and reimporting.
