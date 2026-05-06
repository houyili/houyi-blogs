import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const defaultMetadata = {
  slug: "moe-equal-resources",
  published: "2026-05-02",
  updated: "2026-05-02",
  en: {
    title: "Can MoE Match Dense at the Same Total Parameters?",
    description:
      "An ICLR 2026 Oral explainer on whether MoE can match Dense LLMs under strictly equal total parameters, compute, and data accounting.",
    category: "Paper Explainer",
    read_time: "45 min read",
    tags: ["MoE", "Activation Rate", "Data Reuse", "ICLR 2026"],
    translation: "zh/moe-equal-resources"
  },
  zh: {
    title: "能否训出和 Dense 总参相同、性能相同的 MoE 模型？",
    description:
      "一篇 ICLR 2026 Oral 宣传解读：在严格相同总参数、训练计算和数据账下，MoE 能否匹配 Dense LLM。",
    category: "论文解读",
    read_time: "45 分钟",
    tags: ["MoE", "激活率", "数据复用", "ICLR 2026"],
    translation: "en/moe-equal-resources"
  },
  image: "/assets/papers/moe-equal-resources/reform_datas/figs_empirical/3B_7B_train_token_ratio_combined.png",
  venue: "ICLR 2026",
  venue_type: "Oral",
  paper_url: "",
  project: "moe-equal-resources"
};

const rawArgs = process.argv.slice(2);
const sourceArg = rawArgs.find((arg) => !arg.startsWith("--"));
if (!sourceArg) {
  throw new Error("Usage: npm run import:draft -- /absolute/path/to/blog.md [--slug=post-slug]");
}

const slug = readOption("slug") ?? defaultMetadata.slug;
const sourcePath = path.resolve(sourceArg);
const sourceProject = path.dirname(sourcePath);
const sourceDraft = path.basename(sourcePath);
const assetOutRoot = path.join(repoRoot, "public", "assets", "papers", slug);
const siteBase = await readAstroBase();

const source = await readFile(sourcePath, "utf8");
const sourceHash = sha256(source);
const sourceInfo = await stat(sourcePath);
const importedAt = sourceInfo.mtime.toISOString();
const split = splitBilingualDraft(source);
const references = extractReferences(split.zh);
const enBody = prepareBody(split.en + (references ? `\n\n${references}` : ""), slug, sourceProject, siteBase);
const zhBody = prepareBody(stripReferences(split.zh) + (references ? `\n\n${references}` : ""), slug, sourceProject, siteBase);
const copiedAssets = await copyReferencedAssets([...enBody.assets, ...zhBody.assets], sourceProject, assetOutRoot);

const enMdx = createPostMdx({
  lang: "en",
  meta: defaultMetadata.en,
  body: enBody.markdown,
  sourcePath,
  sourceProject,
  sourceDraft,
  sourceHash,
  importedAt,
  slug
});
const zhMdx = createPostMdx({
  lang: "zh",
  meta: defaultMetadata.zh,
  body: zhBody.markdown,
  sourcePath,
  sourceProject,
  sourceDraft,
  sourceHash,
  importedAt,
  slug
});

const enPath = path.join(repoRoot, "src", "content", "post", "en", `${slug}.mdx`);
const zhPath = path.join(repoRoot, "src", "content", "post", "zh", `${slug}.mdx`);
await rm(path.join(repoRoot, "src", "content", "post", "en", `${slug}.md`), { force: true });
await rm(path.join(repoRoot, "src", "content", "post", "zh", `${slug}.md`), { force: true });
await mkdir(path.dirname(enPath), { recursive: true });
await mkdir(path.dirname(zhPath), { recursive: true });
await writeFile(enPath, enMdx, "utf8");
await writeFile(zhPath, zhMdx, "utf8");

const report = buildReport({
  source,
  split,
  enMdx,
  zhMdx,
  enPath,
  zhPath,
  copiedAssets,
  sourceHash,
  importedAt,
  sourcePath,
  slug
});
await writeFile(path.join(assetOutRoot, "import-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (report.validation.missingAssets.length > 0 || report.validation.localPathLeaks.length > 0) {
  console.error(JSON.stringify(report.validation, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Imported ${slug}`);
  console.log(`- ${path.relative(repoRoot, enPath)}`);
  console.log(`- ${path.relative(repoRoot, zhPath)}`);
  console.log(`- ${path.relative(repoRoot, path.join(assetOutRoot, "import-report.json"))}`);
}

function readOption(name) {
  const prefix = `--${name}=`;
  return rawArgs.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function splitBilingualDraft(markdown) {
  const enMarker = markdown.match(/^## I\. English Draft\s*$/m);
  const zhMarker = markdown.match(/^## II\. 中文稿.*$/m);
  if (!enMarker || !zhMarker || enMarker.index === undefined || zhMarker.index === undefined) {
    throw new Error("Expected bilingual markers: '## I. English Draft' and '## II. 中文稿...'");
  }

  const enStart = enMarker.index + enMarker[0].length;
  const zhStart = zhMarker.index + zhMarker[0].length;
  return {
    en: markdown.slice(enStart, zhMarker.index).trim(),
    zh: markdown.slice(zhStart).trim()
  };
}

function extractReferences(markdown) {
  const match = markdown.match(/\n---\s*\n+## References \/ 参考文献[\s\S]*$/);
  return match?.[0].trim() ?? "";
}

function stripReferences(markdown) {
  return markdown.replace(/\n---\s*\n+## References \/ 参考文献[\s\S]*$/, "").trim();
}

function prepareBody(markdown, slug, sourceProject, siteBase) {
  const headingShifted = normalizeDisplayMath(shiftHeadings(markdown));
  const assets = collectReferencedAssets(headingShifted);
  const rewritten = makeMdxCompatible(rewriteAssetPaths(headingShifted, slug, sourceProject, siteBase));
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

function collectReferencedAssets(markdown) {
  const found = new Set();
  const patterns = [
    /<img\b[^>]*\bsrc="([^"]+)"/g,
    /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    /\[[^\]]+]\((references\/[^)\s]+)(?:\s+"[^"]*")?\)/g
  ];

  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      const target = match[1];
      if (isLocalAsset(target)) found.add(target);
    }
  }
  return [...found].sort();
}

function rewriteAssetPaths(markdown, slug, sourceProject, siteBase) {
  return markdown
    .replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/g, (full, prefix, target, suffix) => {
      if (!isLocalAsset(target)) return full;
      return `${prefix}${webPathFor(target, slug, sourceProject, siteBase)}${suffix}`;
    })
    .replace(/(!\[[^\]]*]\()([^) \t]+)((?:\s+"[^"]*")?\))/g, (full, prefix, target, suffix) => {
      if (!isLocalAsset(target)) return full;
      return `${prefix}${webPathFor(target, slug, sourceProject, siteBase)}${suffix}`;
    })
    .replace(/(\[[^\]]+]\()(references\/[^) \t]+)((?:\s+"[^"]*")?\))/g, (_, prefix, target, suffix) => {
      return `${prefix}${webPathFor(target, slug, sourceProject, siteBase)}${suffix}`;
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

function isLocalAsset(target) {
  return /^(blog_assets|reform_datas|references)\//.test(target);
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
  const uniqueAssets = [...new Set(assets)].sort();
  for (const asset of uniqueAssets) {
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

function createPostMdx({ lang, meta, body, sourceProject, sourceDraft, sourceHash, importedAt, slug }) {
  const frontmatter = {
    title: meta.title,
    description: meta.description,
    published: defaultMetadata.published,
    updated: defaultMetadata.updated,
    lang,
    post_slug: slug,
    translation: meta.translation,
    category: meta.category,
    read_time: meta.read_time,
    image: defaultMetadata.image,
    tags: meta.tags,
    pinned: true,
    paper: true,
    project: defaultMetadata.project,
    venue: defaultMetadata.venue,
    venue_type: defaultMetadata.venue_type,
    paper_url: defaultMetadata.paper_url,
    source_project: sourceProject,
    source_draft: sourceDraft,
    source_hash: sourceHash,
    imported_at: importedAt,
    draft: false
  };

  return `---\n${toYaml(frontmatter)}---\n\n${body}\n`;
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

function buildReport({ source, split, enMdx, zhMdx, enPath, zhPath, copiedAssets, sourceHash, importedAt, sourcePath, slug }) {
  const generatedCombined = `${stripFrontmatter(enMdx)}\n${stripFrontmatter(zhMdx)}`;
  const localPathPattern = /\/Users\/|Documents\/项目文档|file:\/\//g;
  const refs = [...new Set([...collectReferencedAssets(split.en), ...collectReferencedAssets(split.zh)])].sort();
  return {
    slug,
    source: sourcePath,
    imported_at: importedAt,
    hashes: {
      source: sourceHash,
      english_segment: sha256(split.en),
      chinese_segment: sha256(split.zh),
      english_output: sha256(enMdx),
      chinese_output: sha256(zhMdx)
    },
    outputs: {
      en: path.relative(repoRoot, enPath),
      zh: path.relative(repoRoot, zhPath)
    },
    counts: {
      source: countFeatures(source),
      english_segment: countFeatures(split.en),
      chinese_segment: countFeatures(split.zh),
      generated: countFeatures(generatedCombined)
    },
    assets: {
      referenced: refs,
      copied: copiedAssets.copied.map((asset) => ({ ...asset, output: path.relative(repoRoot, asset.output) })),
      missing: copiedAssets.missing
    },
    validation: {
      missingAssets: copiedAssets.missing,
      localPathLeaks: [...new Set(generatedCombined.match(localPathPattern) ?? [])],
      textDiffPolicy:
        "Expected mechanical differences: frontmatter, language split, heading-level promotion, references rendered in both language outputs, asset URL rewrite, and JSX-safe normalization for raw HTML attributes."
    }
  };
}

function countFeatures(markdown) {
  return {
    images: countMatches(markdown, /<img\b|!\[[^\]]*]\(/g),
    tables: countMatches(markdown, /<table\b|^\|.*\|$/gm),
    figures: countMatches(markdown, /<figure\b/g),
    figcaptions: countMatches(markdown, /<figcaption\b|\*Figure |\*Table |\*Appendix Figure |\*Appendix Table |附录图|附录表/g),
    displayMath: countMatches(markdown, /\$\$[\s\S]*?\$\$/g),
    inlineMathApprox: countMatches(markdown, /(?<!\$)\$(?!\$)[^$\n]+\$/g),
    equationTags: countMatches(markdown, /\\tag\{/g),
    rawHtmlBlocks: countMatches(markdown, /^<(div|figure|table)\b/gm),
    headings: countMatches(markdown, /^#{1,6}\s+/gm)
  };
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
