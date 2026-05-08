import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
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
const baseUrl = `http://127.0.0.1:${port}`;

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
  await waitForServer(`${baseUrl}/en/${slug}/`);
  const shots = [
    ["en-desktop.png", "1440,1050", `${baseUrl}/en/${slug}/`],
    ["zh-desktop.png", "1440,1050", `${baseUrl}/zh/${slug}/`],
    ["en-mobile.png", "390,900", `${baseUrl}/en/${slug}/`],
    ["zh-mobile.png", "390,900", `${baseUrl}/zh/${slug}/`]
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

  await writeFile(path.join(outDir, "vlm-prompt.md"), vlmPrompt(slug), "utf8");
  console.log(`Visual verification package written to ${path.relative(repoRoot, outDir)}`);
  for (const [file] of shots) console.log(`- ${path.relative(repoRoot, path.join(outDir, file))}`);
  console.log(`- ${path.relative(repoRoot, path.join(outDir, "vlm-prompt.md"))}`);
} finally {
  server.kill("SIGTERM");
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

function vlmPrompt(slug) {
  return `# VLM Visual Check Prompt: ${slug}

Compare source-reference screenshots from the paper repository against these website screenshots:

- en-desktop.png
- zh-desktop.png
- en-mobile.png
- zh-mobile.png

Report only structural or preservation problems:

- heading hierarchy mismatch
- missing or reordered figures/tables
- figure/table captions not adjacent to the right visual
- double-figure or grid layout broken
- formula number/tag missing or out of order
- small card/stat block lost
- appendix/reference content missing
- obvious horizontal overflow or unreadable table/formula

Do not rewrite prose. Do not propose copy edits. Return a concise issue list with screenshot name and approximate location.
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
