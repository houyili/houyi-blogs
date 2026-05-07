import { lstat, mkdir, readlink, symlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const source = path.join(repoRoot, "skills", "paper-blog-importer");
const codexHome = process.env.CODEX_HOME || path.join(process.env.HOME, ".codex");
const skillsDir = path.join(codexHome, "skills");
const target = path.join(skillsDir, "paper-blog-importer");

await mkdir(skillsDir, { recursive: true });

try {
  const info = await lstat(target);
  if (info.isSymbolicLink()) {
    const current = path.resolve(path.dirname(target), await readlink(target));
    if (current === source) {
      console.log(`Skill already installed: ${target} -> ${source}`);
      process.exit(0);
    }
  }
  throw new Error(`Refusing to overwrite existing skill at ${target}. Remove it manually or choose a different CODEX_HOME.`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await symlink(source, target, "dir");
console.log(`Installed skill: ${target} -> ${source}`);
