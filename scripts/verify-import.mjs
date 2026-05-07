import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const slug = args.slug;

if (!slug) {
  throw new Error("Usage: npm run verify:import -- --slug <slug>");
}

const reportPath = path.join(repoRoot, "public", "assets", "papers", slug, "import-report.json");
if (!existsSync(reportPath)) {
  throw new Error(`Missing import report: ${reportPath}`);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const failures = [];
if (report.validation.missingAssets.length > 0) failures.push(`missing assets: ${report.validation.missingAssets.join(", ")}`);
if (report.validation.localPathLeaks.length > 0) failures.push(`local path leaks: ${report.validation.localPathLeaks.join(", ")}`);
if (report.validation.countMismatches.length > 0) {
  failures.push(`count mismatches: ${JSON.stringify(report.validation.countMismatches)}`);
}
if (!report.validation.textHashesMatch) failures.push("normalized text hash mismatch");

for (const output of Object.values(report.outputs)) {
  if (typeof output === "string" && output.endsWith(".mdx") && !existsSync(path.join(repoRoot, output))) {
    failures.push(`missing output file: ${output}`);
  }
}

if (failures.length > 0) {
  console.error(`Import verification failed for ${slug}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Import verification passed for ${slug}`);
console.log(`- images: ${report.counts.generated.images}`);
console.log(`- tables: ${report.counts.generated.tables}`);
console.log(`- display math: ${report.counts.generated.displayMath}`);
console.log(`- equation tags: ${report.counts.generated.equationTags}`);
console.log(`- raw HTML blocks: ${report.counts.generated.rawHtmlBlocks}`);

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
