import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const ignoredDirs = new Set([".git", "node_modules", ".next", "coverage"]);

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

for (const [file, expected] of [
  ["package.json", /"name":\s*"yusuf-clothing-line"/],
  ["src/app/layout.tsx", /Yusuf Clothing Line \| Tailoring & Alterations/],
  ["src/app/layout.tsx", /applicationName:\s*"Yusuf Clothing Line"/],
  ["public/manifest.webmanifest", /"name":\s*"Yusuf Clothing Line \| Tailoring & Alterations"/],
  ["public/manifest.webmanifest", /"short_name":\s*"Yusuf Clothing"/],
  ["src/app/manifest.ts", /short_name:\s*"Yusuf Clothing"/],
  ["src/app/manifest.ts", /theme_color:\s*"#6B2636"/],
  ["public/sw.js", /yusuf-clothing-shell-v\d+/],
  ["public/sw.js", /yusuf-clothing-media-v\d+/],
  ["public/sw.js", /__YUSUF_FIREBASE_CONFIG__/],
  [".env.example", /NEXT_PUBLIC_FIREBASE_PROJECT_ID=yusuf-clothing-line/],
  [".env.example", /FIREBASE_PROJECT_ID=yusuf-clothing-line/],
]) {
  if (!expected.test(read(file))) failures.push(file + ": missing expected Yusuf identity/configuration");
}

for (const file of ["public/manifest.webmanifest", "src/app/manifest.ts", "src/app/layout.tsx", "public/sw.js"]) {
  const content = read(file);
  if (/the-plug-pearl\.vercel\.app|the-plug\.vercel\.app|africhiko\.firebaseapp\.com|projectId:\s*["']africhiko["']/i.test(content)) {
    failures.push(file + ": inherited production identity or Firebase project remains");
  }
}

if (!fs.existsSync(path.join(root, "public/yusuf-icon.svg"))) {
  failures.push("public/yusuf-icon.svg: missing Yusuf app icon");
}

if (failures.length) {
  console.error("YUSUF IDENTITY VERIFICATION FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("YUSUF CORE IDENTITY VERIFIED — metadata, manifests, cache namespace and Firebase project target.");
