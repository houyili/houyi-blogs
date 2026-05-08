import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const slug = args.slug;
const chrome = args.chrome || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = Number(args.port || 4321);
const siteBase = await readAstroBase();
const origin = `http://127.0.0.1:${port}`;
const baseUrl = `${origin}${siteBase}`;

if (!slug) throw new Error("Usage: npm run verify:visual -- --slug <slug>");
if (!existsSync(chrome)) throw new Error(`Chrome not found at ${chrome}. Install Google Chrome or pass --chrome <path>.`);

const outDir = path.join(repoRoot, "tmp", "visual-check", slug);
await mkdir(outDir, { recursive: true });

const server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: repoRoot,
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"]
});

try {
  await waitForServer(siteUrl(`/en/${slug}/`));
  const shots = [
    ["article-en-desktop.png", "1440,1050", siteUrl(`/en/${slug}/`)],
    ["article-zh-desktop.png", "1440,1050", siteUrl(`/zh/${slug}/`)],
    ["article-en-mobile.png", "390,900", siteUrl(`/en/${slug}/`)],
    ["article-zh-mobile.png", "390,900", siteUrl(`/zh/${slug}/`)],
    ["home-en-desktop.png", "1440,1050", siteUrl("/en/")],
    ["home-zh-desktop.png", "1440,1050", siteUrl("/zh/")],
    ["home-en-mobile.png", "390,900", siteUrl("/en/")],
    ["home-zh-mobile.png", "390,900", siteUrl("/zh/")]
  ];

  for (const [file, windowSize, url] of shots) {
    await execFileAsync(chrome, [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${windowSize}`,
      `--screenshot=${path.join(outDir, file)}`,
      url
    ]);
  }

  await writeFile(path.join(outDir, "vlm-prompt.md"), vlmPrompt(slug, shots, siteBase), "utf8");
  console.log(`Visual verification package written to ${path.relative(repoRoot, outDir)}`);
  for (const [file] of shots) console.log(`- ${path.relative(repoRoot, path.join(outDir, file))}`);
  console.log(`- ${path.relative(repoRoot, path.join(outDir, "vlm-prompt.md"))}`);
} finally {
  server.kill("SIGTERM");
}

async function readAstroBase() {
  const config = await readFile(path.join(repoRoot, "astro.config.mjs"), "utf8");
  const match = config.match(/\bbase:\s*["']([^"']+)["']/);
  if (!match) return "";
  if (match[1] === "/") return "";
  return match[1].endsWith("/") ? match[1].slice(0, -1) : match[1];
}

function siteUrl(pathname) {
  return `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

async function waitForServer(url) {
  const deadline = Date.now() + 15000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Preview server did not become ready: ${lastError?.message ?? "unknown error"}`);
}

function vlmPrompt(slug, shots, siteBase) {
  const shotList = shots.map(([file]) => `- ${file}`).join("\n");
  return `# VLM Visual Check Prompt: ${slug}

Current Astro base path: \`${siteBase || "/"}\`.

Compare source-reference screenshots from the paper repository against these website screenshots:

${shotList}

Report only structural or preservation problems. Do not rewrite prose. Do not propose copy edits.

## Article Checks

- Heading hierarchy mismatch.
- Missing, reordered, or duplicated figures/tables.
- Figure/table captions not adjacent to the right visual.
- Double-figure, four-figure, flex, or grid layout broken.
- Formula number/tag missing, duplicated, or out of order.
- Small card/stat/download block lost.
- Paper / Slides / Poster download cards visible and clickable-looking.
- Appendix/reference content missing.
- P1/P2 previous/next footer cards present when this slug is part of a split article.
- P1 and P2 read as one split article: shared title/subtitle/tags, continuous numbering, and no duplicated/missing intro/download blocks beyond what source contains.
- Obvious horizontal overflow or unreadable table/formula.
- Title sizes and right-side TOC do not visually overwhelm the content.

## Homepage Checks

Use the home screenshots to check the article set after import:

- P1 appears before P2 when both belong to the same paper.
- Deleted placeholder posts are gone.
- Pinned rail reflects only \`pinned: true\` posts.
- Topics and search placeholder use current tags only.
- My Papers / Open Source / Reading Notes navigation lands on real sections or clear empty states.
- Asset URLs load under the current deployed base/domain; report broken assets as importer/link issues, not domain-configuration tasks.

Return a concise issue list with screenshot name and approximate location. If no structural issue is visible, say so explicitly.
`;
}

function parseArgs(rawArgs) {
  const options = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.slice(2).split("=", 2);
    options[key] = inlineValue ?? rawArgs[++i];
  }
  return options;
}
