import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { lstat, mkdir, mkdtemp, readFile, readlink, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const skillRoot = path.join(repoRoot, "skills", "paper-blog-importer");
const installScript = path.join(repoRoot, "scripts", "install-skill.mjs");
const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "houyi-skill-self-test-"));

try {
  await assertRequiredFiles();
  await assertReferencedFiles();
  await assertNoLocalPathLeaks();
  await assertFreshInstall();
  await assertRelinkOldSymlink();
  await assertRefuseRealDirectory();
  console.log("Skill self-test passed");
} finally {
  await rm(tmpRoot, { recursive: true, force: true });
}

async function assertRequiredFiles() {
  const required = [
    "SKILL.md",
    "agents/openai.yaml",
    "references/import-contract.md",
    "references/split-body-appendix.md",
    "references/vlm-visual-check.md"
  ];
  for (const relative of required) {
    const file = path.join(skillRoot, relative);
    if (!existsSync(file)) throw new Error(`Missing skill file: ${relative}`);
  }
}

async function assertReferencedFiles() {
  const skillText = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
  const references = [...skillText.matchAll(/`(references\/[^`]+\.md)`/g)].map((match) => match[1]);
  for (const relative of references) {
    const file = path.join(skillRoot, relative);
    if (!existsSync(file)) throw new Error(`SKILL.md references missing file: ${relative}`);
  }
}

async function assertNoLocalPathLeaks() {
  const scanned = [
    path.join(skillRoot, "SKILL.md"),
    path.join(skillRoot, "agents", "openai.yaml"),
    path.join(skillRoot, "references", "import-contract.md"),
    path.join(skillRoot, "references", "split-body-appendix.md"),
    path.join(skillRoot, "references", "vlm-visual-check.md"),
    installScript,
    path.join(repoRoot, "scripts", "verify-visual.mjs")
  ];
  const forbidden = [
    new RegExp('/' + 'Users/'),
    new RegExp('\\.codex/' + 'worktrees'),
    new RegExp('Temporary' + 'Items'),
    new RegExp('/private/' + 'tmp'),
    new RegExp('jyxc-' + 'dz'),
  ];
  for (const file of scanned) {
    const text = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(text)) throw new Error(`Local path leak in ${path.relative(repoRoot, file)}: ${pattern}`);
    }
  }
}

async function assertFreshInstall() {
  const codexHome = path.join(tmpRoot, "fresh-codex-home");
  await runInstaller(codexHome);
  await assertSymlink(path.join(codexHome, "skills", "paper-blog-importer"), skillRoot);
  const second = await runInstaller(codexHome);
  if (!second.stdout.includes("Skill already installed")) throw new Error("Repeated install did not report idempotent no-op");
}

async function assertRelinkOldSymlink() {
  const codexHome = path.join(tmpRoot, "relink-codex-home");
  const skillsDir = path.join(codexHome, "skills");
  const target = path.join(skillsDir, "paper-blog-importer");
  await mkdir(skillsDir, { recursive: true });
  await symlink(path.join(tmpRoot, "old-clone", "skills", "paper-blog-importer"), target, "dir");
  const result = await runInstaller(codexHome);
  if (!result.stdout.includes("Relinked skill")) throw new Error("Old symlink was not relinked");
  await assertSymlink(target, skillRoot);
}

async function assertRefuseRealDirectory() {
  const codexHome = path.join(tmpRoot, "real-dir-codex-home");
  const target = path.join(codexHome, "skills", "paper-blog-importer");
  await mkdir(target, { recursive: true });
  try {
    await runInstaller(codexHome);
  } catch (error) {
    if (String(error.stderr).includes("Refusing to overwrite non-symlink skill")) return;
    if (String(error.message).includes("Refusing to overwrite non-symlink skill")) return;
    throw error;
  }
  throw new Error("Installer overwrote or accepted a real skill directory");
}

async function runInstaller(codexHome) {
  return execFileAsync(process.execPath, [installScript], {
    cwd: repoRoot,
    env: { ...process.env, CODEX_HOME: codexHome }
  });
}

async function assertSymlink(target, expected) {
  const info = await lstat(target);
  if (!info.isSymbolicLink()) throw new Error(`Target is not a symlink: ${target}`);
  const actual = path.resolve(path.dirname(target), await readlink(target));
  if (actual !== expected) throw new Error(`Unexpected symlink target: ${actual}, expected ${expected}`);
}
