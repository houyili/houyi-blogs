import { lstat, mkdir, readlink, rm, symlink } from "node:fs/promises";
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
  if (!info.isSymbolicLink()) {
    throw new Error(`Refusing to overwrite non-symlink skill at ${target}. Move it manually or choose a different CODEX_HOME.`);
  }

  const current = path.resolve(path.dirname(target), await readlink(target));
  if (current === source) {
    console.log(`Skill already installed: ${target} -> ${source}`);
    process.exit(0);
  }

  await rm(target);
  await symlink(source, target, "dir");
  console.log(`Relinked skill: ${target} -> ${source} (was ${current})`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await symlink(source, target, "dir");
  console.log(`Installed skill: ${target} -> ${source}`);
}
