import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "scripts/identity.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const failures = [];
const ignoredDirs = new Set([".git", "node_modules", ".next", "coverage", ".vercel"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".webmanifest", ".css", ".md", ".yml", ".yaml", ".html", ".txt", ".rules", ".svg", ".xml", ".sh"]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}
function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (textExtensions.has(path.extname(entry.name).toLowerCase()) || entry.name === ".env.example") files.push(full);
  }
  return files;
}
function allowedLegacy(relativePath, pattern) {
  return (config.allowedLegacyStrings || []).some(item => item.path === relativePath && item.pattern.toLowerCase() === pattern.toLowerCase() && typeof item.reason === "string" && item.reason.trim().length > 10);
}
function fail(message) { failures.push(message); }

const packageJson = JSON.parse(read("package.json"));
if (packageJson.name !== "yusuf-clothing-line") fail("package.json name is not yusuf-clothing-line.");

const publicManifest = JSON.parse(read("public/manifest.webmanifest"));
if (publicManifest.name !== config.manifestName) fail("Public manifest name differs from identity.config.json.");
if (publicManifest.short_name !== config.shortName) fail("Public manifest short_name differs from identity.config.json.");
if (publicManifest.theme_color !== config.themeColor) fail("Public manifest theme_color differs from identity.config.json.");
if (!Array.isArray(publicManifest.icons) || !publicManifest.icons.some(icon => icon.src === config.canonicalIcon)) fail("Public manifest does not reference the configured canonical icon.");

const generatedManifest = read("src/app/manifest.ts");
for (const [field, value] of [["name", config.manifestName], ["short_name", config.shortName], ["theme_color", config.themeColor]]) {
  if (!generatedManifest.includes(field + ': "' + value + '"')) fail("Generated manifest does not match " + field + ".");
}
if (!generatedManifest.includes('src: "' + config.canonicalIcon + '"')) fail("Generated manifest does not reference the configured canonical icon.");

const layout = read("src/app/layout.tsx");
if (!layout.includes(config.manifestName) || !layout.includes('applicationName: "Yusuf Clothing Line"')) fail("Root metadata does not use Yusuf identity.");
if (!layout.includes('"/manifest.webmanifest"')) fail("Root metadata does not reference the manifest.");
const sw = read("public/sw.js");
if (!sw.includes(config.serviceWorkerCachePrefix + "shell-v")) fail("Service worker shell cache does not use the configured unique prefix.");
if (!sw.includes(config.serviceWorkerCachePrefix + "media-v")) fail("Service worker media cache does not use the configured unique prefix.");
if (!sw.includes("__YUSUF_FIREBASE_CONFIG__")) fail("Service worker Firebase messaging config key is not Yusuf-specific.");

const firebaseClient = read("src/lib/firebase/client.ts");
if (!firebaseClient.includes('projectId: "' + config.firebaseProjectId + '"') || !firebaseClient.includes("matchesYusufProject")) fail("Firebase client does not fail closed for non-Yusuf project configuration.");
const env = read(".env.example");
if (!env.includes("NEXT_PUBLIC_FIREBASE_PROJECT_ID=" + config.firebaseProjectId) || !env.includes("FIREBASE_PROJECT_ID=" + config.firebaseProjectId)) fail(".env.example does not target the dedicated Yusuf Firebase project.");
if (!env.includes("YUSUF_OPERATIONS_WORD=")) fail(".env.example does not document Yusuf's separate operations secret.");

for (const icon of ["/yusuf-icon.svg", "/yusuf-icon-192.png", "/yusuf-icon-512.png"]) {
  const file = path.join(root, "public", icon.replace(/^\//, ""));
  if (!fs.existsSync(file)) { fail("Missing icon asset " + icon + "."); continue; }
  if (icon.endsWith(".png")) {
    const bytes = fs.readFileSync(file);
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) {
      fail(icon + " is not a valid PNG file.");
      continue;
    }
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    const expected = icon.includes("192") ? 192 : 512;
    if (width !== expected || height !== expected) fail(icon + " must be " + expected + "x" + expected + "; found " + width + "x" + height + ".");
  }
}

const allFiles = walk(root);
for (const absolutePath of allFiles) {
  const relativePath = path.relative(root, absolutePath).replace(/\\/g, "/");
  let content;
  try { content = fs.readFileSync(absolutePath, "utf8"); } catch { continue; }
  for (const pattern of config.forbiddenPatterns || []) {
    const expression = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (expression.test(content) && !allowedLegacy(relativePath, pattern)) {
      fail(relativePath + " contains forbidden inherited identity/resource text: " + pattern + ".");
    }
  }
}

// Protect the approved installation experience from accidental regressions.
const pwaRegister = read("src/app/pwa-register.tsx");
const pwaStyles = read("src/app/pwa.css");
const layoutSource = read("src/app/layout.tsx");
const installInvariants = [
  ["retained native beforeinstallprompt event", pwaRegister.includes("beforeinstallprompt")],
  ["direct native prompt invocation from install click", pwaRegister.includes("prompt.prompt()")],
  ["branded dismissible Yusuf install card", pwaRegister.includes('className="yusufInstallCard"') && pwaRegister.includes('aria-label="Dismiss installation card"')],
  ["native CTA gated by native availability or iOS Safari", pwaRegister.includes("nativeInstallAvailable || iosSafari")],
  ["iOS Safari Share → Add to Home Screen guidance", pwaRegister.includes("Share") && pwaRegister.includes("Add to Home Screen")],
  ["service-worker registration", pwaRegister.includes('navigator.serviceWorker.register("/sw.js")')],
  ["safe-area-aware mobile install spacing", pwaStyles.includes("env(safe-area-inset-bottom)")],
  ["early pre-hydration native event capture", layoutSource.includes("__yusufInstallPrompt") && layoutSource.includes("beforeinstallprompt")],
];
for (const [label, passed] of installInvariants) {
  if (!passed) fail("PWA installation invariant missing: " + label + ".");
}
if (/Chrome.{0,30}menu|Install page as app|If your browser provides a native install prompt/i.test(pwaRegister)) {
  fail("Generic desktop/Android installation fallback copy must not appear in the install controller.");
}

if (failures.length) {
  console.error("YUSUF IDENTITY VERIFICATION FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("YUSUF IDENTITY VERIFIED — package, metadata, manifests, raster/SVG icons, cache namespace and Firebase target.");
