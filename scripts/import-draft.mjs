import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultAssetRoots = ["blog_assets", "reform_datas", "references"];
const defaultSections = {
  en_marker: "^## I\\. English Draft\\s*$",
  zh_marker: "^## II\\. 中文稿.*$"
};

const args = parseArgs(process.argv.slice(2));
const setup = await loadSetup(args);
const siteBase = await readAstroBase();
const loaded = await loadSourceSections(setup);
const importedAt = loaded.sourceMtime.toISOString();
const references = extractReferences(loaded.zh);
const enSourceBody = loaded.en + (references ? `\n\n${references}` : "");
const zhSourceBody = stripReferences(loaded.zh) + (references ? `\n\n${references}` : "");
const enBody = prepareBody(enSourceBody, setup.config, loaded.sourceProject, siteBase);
const zhBody = prepareBody(zhSourceBody, setup.config, loaded.sourceProject, siteBase);
const assetOutRoot = args.dryRun
  ? path.join(repoRoot, "tmp", "import-dry-run", setup.config.slug, "assets")
  : path.join(repoRoot, "public", "assets", "papers", setup.config.slug);
const copiedAssets = await copyReferencedAssets([...enBody.assets, ...zhBody.assets], loaded.sourceProject, assetOutRoot);

const enMdx = createPostMdx({
  lang: "en",
  post: setup.config.posts.en,
  body: enBody.markdown,
  source: loaded,
  setup,
  importedAt
});
const zhMdx = createPostMdx({
  lang: "zh",
  post: setup.config.posts.zh,
  body: zhBody.markdown,
  source: loaded,
  setup,
  importedAt
});

const outRoot = args.dryRun ? path.join(repoRoot, "tmp", "import-dry-run", setup.config.slug, "content") : repoRoot;
const enPath = path.join(outRoot, "src", "content", "post", "en", `${setup.config.slug}.mdx`);
const zhPath = path.join(outRoot, "src", "content", "post", "zh", `${setup.config.slug}.mdx`);
await rm(path.join(path.dirname(enPath), `${setup.config.slug}.md`), { force: true });
await rm(path.join(path.dirname(zhPath), `${setup.config.slug}.md`), { force: true });
await mkdir(path.dirname(enPath), { recursive: true });
await mkdir(path.dirname(zhPath), { recursive: true });
await writeFile(enPath, enMdx, "utf8");
await writeFile(zhPath, zhMdx, "utf8");

const report = buildReport({
  setup,
  loaded,
  sourceBodies: { en: enSourceBody, zh: zhSourceBody },
  enMdx,
  zhMdx,
  enPath,
  zhPath,
  copiedAssets,
  importedAt,
  assetOutRoot
});
await mkdir(path.dirname(reportPath(setup.config.slug, args.dryRun)), { recursive: true });
await writeFile(reportPath(setup.config.slug, args.dryRun), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const failures = collectValidationFailures(report);
if (failures.length > 0) {
  console.error(JSON.stringify({ failures, validation: report.validation }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Imported ${setup.config.slug}${args.dryRun ? " (dry run)" : ""}`);
  console.log(`- ${path.relative(repoRoot, enPath)}`);
  console.log(`- ${path.relative(repoRoot, zhPath)}`);
  console.log(`- ${path.relative(repoRoot, reportPath(setup.config.slug, args.dryRun))}`);
}

function parseArgs(rawArgs) {
  const options = { dryRun: false };
  const positional = [];
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.slice(2).split("=", 2);
      options[toCamel(key)] = inlineValue ?? rawArgs[++i];
    } else {
      positional.push(arg);
    }
  }
  options.source = positional[0];
  return options;
}

function toCamel(key) {
  return key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

async function loadSetup(options) {
  const sourcePath = options.source ? path.resolve(options.source) : undefined;
  const configPath = options.config
    ? path.resolve(options.config)
    : sourcePath
      ? path.join(path.dirname(sourcePath), `${path.basename(sourcePath, path.extname(sourcePath))}.import.yaml`)
      : undefined;

  if (!configPath) {
    throw new Error("Usage: npm run import:draft -- /path/to/blog.md [--config /path/to/blog.import.yaml] [--dry-run]");
  }

  if (!existsSync(configPath)) {
    if (!sourcePath) throw new Error(`Missing config: ${configPath}`);
    await createConfigTemplate(sourcePath, configPath, options.slug);
    console.error(`Created sidecar config template: ${configPath}`);
    console.error("Fill the TODO metadata, then rerun the import command.");
    process.exit(2);
  }

  const config = YAML.parse(await readFile(configPath, "utf8"));
  if (options.slug) config.slug = options.slug;
  normalizeConfig(config);
  validateConfig(config, configPath);
  return { config, configPath, sourceArg: sourcePath };
}

async function createConfigTemplate(sourcePath, configPath, slugOverride) {
  const source = await readFile(sourcePath, "utf8");
  const title = source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "TODO title";
  const slug = slugOverride ?? slugify(title);
  const today = new Date().toISOString().slice(0, 10);
  const template = {
    slug,
    published: today,
    updated: today,
    pinned: false,
    paper: true,
    project: slug,
    venue: "TODO",
    venue_type: "TODO",
    paper_url: "",
    image: "",
    source_format: "single-bilingual",
    sections: defaultSections,
    posts: {
      en: {
        title,
        description: "TODO",
        category: "Paper Explainer",
        read_time: "TODO min read",
        tags: ["TODO"]
      },
      zh: {
        title: "TODO",
        description: "TODO",
        category: "论文解读",
        read_time: "TODO 分钟",
        tags: ["TODO"]
      }
    },
    asset_roots: defaultAssetRoots
  };
  await writeFile(configPath, YAML.stringify(template), "utf8");
}

function normalizeConfig(config) {
  config.source_format ??= "single-bilingual";
  config.sections = { ...defaultSections, ...(config.sections ?? {}) };
  config.asset_roots = config.asset_roots?.length ? config.asset_roots : defaultAssetRoots;
  config.pinned ??= false;
  config.paper ??= true;
  config.paper_url ??= "";
  config.image ??= "";
  config.posts ??= {};
  config.posts.en ??= {};
  config.posts.zh ??= {};
  config.posts.en.translation = `zh/${config.slug}`;
  config.posts.zh.translation = `en/${config.slug}`;
}

function validateConfig(config, configPath) {
  const required = [
    "slug",
    "published",
    "updated",
    "project",
    "source_format",
    "posts.en.title",
    "posts.en.description",
    "posts.en.category",
    "posts.en.read_time",
    "posts.en.tags",
    "posts.zh.title",
    "posts.zh.description",
    "posts.zh.category",
    "posts.zh.read_time",
    "posts.zh.tags"
  ];
  const missing = required.filter((key) => getPath(config, key) === undefined || getPath(config, key) === "" || hasTodo(getPath(config, key)));
  if (!["single-bilingual", "paired-bilingual"].includes(config.source_format)) {
    missing.push("source_format must be single-bilingual or paired-bilingual");
  }
  if (config.source_format === "paired-bilingual" && (!config.sources?.en || !config.sources?.zh)) {
    missing.push("sources.en and sources.zh");
  }
  if (missing.length > 0) {
    throw new Error(`Import config is incomplete: ${configPath}\n- ${missing.join("\n- ")}`);
  }
}

function getPath(value, dotted) {
  return dotted.split(".").reduce((current, key) => current?.[key], value);
}

function hasTodo(value) {
  if (Array.isArray(value)) return value.some(hasTodo);
  return typeof value === "string" && value.toLowerCase().includes("todo");
}

async function loadSourceSections(setup) {
  const { config, configPath, sourceArg } = setup;
  const configDir = path.dirname(configPath);
  if (config.source_format === "paired-bilingual") {
    const enPath = path.resolve(configDir, config.sources.en);
    const zhPath = path.resolve(configDir, config.sources.zh);
    const [en, zh, enInfo, zhInfo] = await Promise.all([
      readFile(enPath, "utf8"),
      readFile(zhPath, "utf8"),
      stat(enPath),
      stat(zhPath)
    ]);
    return {
      en,
      zh,
      sourceProject: commonDir([enPath, zhPath]),
      sourceDraft: `${path.basename(enPath)},${path.basename(zhPath)}`,
      sourcePaths: { en: enPath, zh: zhPath },
      sourceCombined: `${en}\n${zh}`,
      sourceHash: sha256(`${en}\n${zh}`),
      sourceMtime: new Date(Math.max(enInfo.mtimeMs, zhInfo.mtimeMs))
    };
  }

  const sourcePath = sourceArg ?? path.join(configDir, `${path.basename(configPath).replace(/\.import\.ya?ml$/, "")}.md`);
  const source = await readFile(sourcePath, "utf8");
  const sourceInfo = await stat(sourcePath);
  const split = splitBilingualDraft(source, config.sections);
  return {
    en: split.en,
    zh: split.zh,
    sourceProject: path.dirname(sourcePath),
    sourceDraft: path.basename(sourcePath),
    sourcePaths: { single: sourcePath },
    sourceCombined: source,
    sourceHash: sha256(source),
    sourceMtime: sourceInfo.mtime
  };
}

function commonDir(paths) {
  const dirs = paths.map((item) => path.dirname(item).split(path.sep));
  const first = dirs[0];
  const common = [];
  for (let i = 0; i < first.length; i += 1) {
    if (dirs.every((dir) => dir[i] === first[i])) common.push(first[i]);
    else break;
  }
  return common.length === 1 && common[0] === "" ? path.sep : common.join(path.sep);
}

function splitBilingualDraft(markdown, sections) {
  const enMarker = markdown.match(new RegExp(sections.en_marker, "m"));
  const zhMarker = markdown.match(new RegExp(sections.zh_marker, "m"));
  if (!enMarker || !zhMarker || enMarker.index === undefined || zhMarker.index === undefined) {
    throw new Error("Expected bilingual markers configured by sections.en_marker and sections.zh_marker.");
  }
  return {
    en: markdown.slice(enMarker.index + enMarker[0].length, zhMarker.index).trim(),
    zh: markdown.slice(zhMarker.index + zhMarker[0].length).trim()
  };
}

function extractReferences(markdown) {
  const match = markdown.match(/\n---\s*\n+## References \/ 参考文献[\s\S]*$/);
  return match?.[0].trim() ?? "";
}

function stripReferences(markdown) {
  return markdown.replace(/\n---\s*\n+## References \/ 参考文献[\s\S]*$/, "").trim();
}

function prepareBody(markdown, config, sourceProject, siteBase) {
  const headingShifted = normalizeDisplayMath(shiftHeadings(markdown));
  const assets = collectReferencedAssets(headingShifted, config.asset_roots);
  const rewritten = makeMdxCompatible(rewriteAssetPaths(headingShifted, config, sourceProject, siteBase));
  return { markdown: rewritten.trim(), assets };
}

function shiftHeadings(markdown) {
  return markdown.replace(/^(#{3,6})(\s+)/gm, (_, hashes, space) => `${hashes.slice(1)}${space}`);
}

function normalizeDisplayMath(markdown) {
  return markdown
    .replace(/^\$\$([^\n]+)\$\$/gm, (_, math) => `$$\n${math}\n$$`)
    .replace(/^\$\$([^\n]+)$/gm, (_, math) => `$$\n${math}`)
    .replace(/^([^\n]*\\end\{aligned\}[^\n]*)\$\$/gm, (_, math) => `${math}\n$$`);
}

function collectReferencedAssets(markdown, assetRoots = defaultAssetRoots) {
  const found = new Set();
  const patterns = [
    /<img\b[^>]*\bsrc="([^"]+)"/g,
    /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    /\[[^\]]+]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  ];
  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      const target = match[1];
      if (isLocalAsset(target, assetRoots)) found.add(target);
    }
  }
  return [...found].sort();
}

function rewriteAssetPaths(markdown, config, sourceProject, siteBase) {
  return markdown
    .replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/g, (full, prefix, target, suffix) => {
      if (!isLocalAsset(target, config.asset_roots)) return full;
      return `${prefix}${webPathFor(target, config.slug, sourceProject, siteBase)}${suffix}`;
    })
    .replace(/(!\[[^\]]*]\()([^) \t]+)((?:\s+"[^"]*")?\))/g, (full, prefix, target, suffix) => {
      if (!isLocalAsset(target, config.asset_roots)) return full;
      return `${prefix}${webPathFor(target, config.slug, sourceProject, siteBase)}${suffix}`;
    })
    .replace(/(\[[^\]]+]\()([^) \t]+)((?:\s+"[^"]*")?\))/g, (full, prefix, target, suffix) => {
      if (!isLocalAsset(target, config.asset_roots)) return full;
      return `${prefix}${webPathFor(target, config.slug, sourceProject, siteBase)}${suffix}`;
    });
}

function makeMdxCompatible(markdown) {
  return markdown
    .replace(/\sstyle="([^"]*)"/g, (_, css) => ` style=${cssToJsxObject(css)}`)
    .replace(/<img\b([^>]*?)(?<!\/)>/g, (_, attrs) => `<img${attrs} />`);
}

function cssToJsxObject(css) {
  const entries = css
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const separator = rule.indexOf(":");
      if (separator === -1) return null;
      const property = cssPropertyToJs(rule.slice(0, separator).trim());
      const value = rule.slice(separator + 1).trim();
      return `${property}: ${JSON.stringify(value)}`;
    })
    .filter(Boolean);
  return `{{ ${entries.join(", ")} }}`;
}

function cssPropertyToJs(property) {
  if (property.startsWith("--")) return JSON.stringify(property);
  return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function isLocalAsset(target, assetRoots = defaultAssetRoots) {
  return assetRoots.some((root) => target === root || target.startsWith(`${root}/`));
}

function webPathFor(target, slug, sourceProject, siteBase) {
  const absolute = path.resolve(sourceProject, target);
  const relative = path.relative(sourceProject, absolute).split(path.sep).join("/");
  return `${siteBase}/assets/papers/${slug}/${relative}`;
}

async function readAstroBase() {
  const config = await readFile(path.join(repoRoot, "astro.config.mjs"), "utf8");
  const match = config.match(/\bbase:\s*["']([^"']+)["']/);
  if (!match) return "";
  return match[1].endsWith("/") ? match[1].slice(0, -1) : match[1];
}

async function copyReferencedAssets(assets, sourceProject, outRoot) {
  await rm(outRoot, { recursive: true, force: true });
  await mkdir(outRoot, { recursive: true });
  const copied = [];
  const missing = [];
  for (const asset of [...new Set(assets)].sort()) {
    const from = path.resolve(sourceProject, asset);
    const to = path.join(outRoot, asset);
    if (!existsSync(from)) {
      missing.push(asset);
      continue;
    }
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to);
    const info = await stat(to);
    copied.push({ source: asset, bytes: info.size, output: to });
  }
  return { copied, missing };
}

function createPostMdx({ lang, post, body, source, setup, importedAt }) {
  const { config } = setup;
  const frontmatter = {
    title: post.title,
    description: post.description,
    published: config.published,
    updated: config.updated,
    lang,
    post_slug: config.slug,
    translation: post.translation,
    category: post.category,
    read_time: post.read_time,
    image: config.image ? withSiteBase(config.image) : "",
    tags: post.tags,
    pinned: Boolean(config.pinned),
    paper: Boolean(config.paper),
    project: config.project,
    venue: config.venue ?? "",
    venue_type: config.venue_type ?? "",
    paper_url: config.paper_url ?? "",
    source_project: source.sourceProject,
    source_draft: source.sourceDraft,
    source_hash: source.sourceHash,
    imported_at: importedAt,
    draft: false
  };
  return `---\n${toYaml(frontmatter)}---\n\n${body}\n`;
}

function withSiteBase(image) {
  if (!image || image.startsWith("http") || image.startsWith("/houyi-blogs/")) return image;
  if (image.startsWith("/assets/")) return image;
  return image;
}

function toYaml(value, indent = 0) {
  let out = "";
  const pad = " ".repeat(indent);
  for (const [key, entry] of Object.entries(value)) {
    if (Array.isArray(entry)) {
      out += `${pad}${key}:\n`;
      for (const item of entry) out += `${pad}  - ${quoteYaml(item)}\n`;
    } else {
      out += `${pad}${key}: ${quoteYaml(entry)}\n`;
    }
  }
  return out;
}

function quoteYaml(value) {
  if (typeof value === "boolean") return String(value);
  if (value === "") return '""';
  return JSON.stringify(String(value));
}

function buildReport({ setup, loaded, sourceBodies, enMdx, zhMdx, enPath, zhPath, copiedAssets, importedAt, assetOutRoot }) {
  const generatedCombined = `${stripFrontmatter(enMdx)}\n${stripFrontmatter(zhMdx)}`;
  const sourceCombined = `${sourceBodies.en}\n${sourceBodies.zh}`;
  const refs = [...new Set([...collectReferencedAssets(loaded.en, setup.config.asset_roots), ...collectReferencedAssets(loaded.zh, setup.config.asset_roots)])].sort();
  const sourceCounts = countFeatures(sourceCombined);
  const generatedCounts = countFeatures(generatedCombined);
  const countMismatches = compareCounts(sourceCounts, generatedCounts);
  const normalizedSourceText = comparableText(normalizeDisplayMath(shiftHeadings(sourceCombined)));
  const normalizedGeneratedText = comparableText(generatedCombined);
  const localPathPattern = /\/Users\/|Documents\/项目文档|file:\/\//g;
  return {
    slug: setup.config.slug,
    config: path.relative(repoRoot, setup.configPath),
    source: loaded.sourcePaths,
    imported_at: importedAt,
    hashes: {
      source: loaded.sourceHash,
      english_segment: sha256(loaded.en),
      chinese_segment: sha256(loaded.zh),
      normalized_source_text: sha256(normalizedSourceText),
      normalized_generated_text: sha256(normalizedGeneratedText),
      english_output: sha256(enMdx),
      chinese_output: sha256(zhMdx)
    },
    outputs: {
      en: path.relative(repoRoot, enPath),
      zh: path.relative(repoRoot, zhPath),
      assets: path.relative(repoRoot, assetOutRoot)
    },
    counts: {
      source: sourceCounts,
      english_segment: countFeatures(loaded.en),
      chinese_segment: countFeatures(loaded.zh),
      generated: generatedCounts
    },
    assets: {
      referenced: refs,
      copied: copiedAssets.copied.map((asset) => ({ ...asset, output: path.relative(repoRoot, asset.output) })),
      missing: copiedAssets.missing
    },
    validation: {
      missingAssets: copiedAssets.missing,
      localPathLeaks: [...new Set(generatedCombined.match(localPathPattern) ?? [])],
      countMismatches,
      textHashesMatch: sha256(normalizedSourceText) === sha256(normalizedGeneratedText),
      textDiffPolicy:
        "Expected mechanical differences: frontmatter, language split, heading-level promotion, references rendered in both language outputs, asset URL rewrite, display-math normalization, and JSX-safe normalization for raw HTML attributes."
    }
  };
}

function compareCounts(source, generated) {
  const keys = ["images", "tables", "figures", "figcaptions", "displayMath", "equationTags", "rawHtmlBlocks"];
  return keys
    .filter((key) => source[key] !== generated[key])
    .map((key) => ({ key, source: source[key], generated: generated[key] }));
}

function collectValidationFailures(report) {
  const failures = [];
  if (report.validation.missingAssets.length) failures.push("missing assets");
  if (report.validation.localPathLeaks.length) failures.push("local path leaks");
  if (report.validation.countMismatches.length) failures.push("feature count mismatches");
  if (!report.validation.textHashesMatch) failures.push("normalized text hash mismatch");
  return failures;
}

function countFeatures(markdown) {
  return {
    images: countMatches(markdown, /<img\b|!\[[^\]]*]\(/g),
    tables: countMatches(markdown, /<table\b|^\|.*\|$/gm),
    figures: countMatches(markdown, /<figure\b/g),
    figcaptions: countMatches(markdown, /<figcaption\b|\*Figure |\*Table |\*Appendix Figure |\*Appendix Table |图 \d|表 \d|附录图|附录表/g),
    displayMath: countMatches(markdown, /\$\$[\s\S]*?\$\$/g),
    inlineMathApprox: countMatches(markdown, /(?<!\$)\$(?!\$)[^$\n]+\$/g),
    equationTags: countMatches(markdown, /\\tag\{/g),
    rawHtmlBlocks: countMatches(markdown, /^<(div|figure|table)\b/gm),
    headings: countMatches(markdown, /^#{1,6}\s+/gm)
  };
}

function comparableText(markdown) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/!\[([^\]]*)]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function reportPath(slug, dryRun) {
  return dryRun
    ? path.join(repoRoot, "tmp", "import-dry-run", slug, "import-report.json")
    : path.join(repoRoot, "public", "assets", "papers", slug, "import-report.json");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "paper-blog";
}

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---[\s\S]*?---\s*/, "");
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}
