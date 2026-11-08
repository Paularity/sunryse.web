// Formats the file Claude just edited with Prettier. Silent no-op until the
// app is scaffolded (no Prettier installed yet) or for unsupported files.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css", ".md"]);

let input = "";
for await (const chunk of process.stdin) input += chunk;

try {
  const file = JSON.parse(input)?.tool_input?.file_path;
  if (!file || !EXTS.has(extname(file)) || !existsSync(file)) process.exit(0);

  // Walk up to the nearest node_modules/.bin/prettier
  let dir = dirname(file);
  while (dir !== dirname(dir)) {
    const bin = join(dir, "node_modules", ".bin", process.platform === "win32" ? "prettier.cmd" : "prettier");
    if (existsSync(bin)) {
      execFileSync(bin, ["--write", "--log-level", "silent", file], { stdio: "ignore", shell: process.platform === "win32" });
      break;
    }
    dir = dirname(dir);
  }
} catch {
  // Formatting is best-effort; never block Claude.
}
process.exit(0);
