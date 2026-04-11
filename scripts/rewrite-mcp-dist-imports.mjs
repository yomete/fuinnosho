import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !fullPath.endsWith(".js")) {
      continue;
    }

    const source = fs.readFileSync(fullPath, "utf8");
    const rewritten = source.replace(
      /from\s+["']@\/lib\/([^"']+)["']/g,
      (_match, specifier) => {
        const targetPath = path.join(distRoot, "src", "lib", `${specifier}.js`);
        let relativePath = path.relative(path.dirname(fullPath), targetPath);

        if (!relativePath.startsWith(".")) {
          relativePath = `./${relativePath}`;
        }

        return `from "${relativePath.replaceAll(path.sep, "/")}"`;
      }
    );

    if (rewritten !== source) {
      fs.writeFileSync(fullPath, rewritten);
    }
  }
}

walk(distRoot);
