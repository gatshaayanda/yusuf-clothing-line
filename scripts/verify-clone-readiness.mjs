import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const checks = [];
function exists(relativePath) { return fs.existsSync(path.join(root, relativePath)); }
function read(relativePath) { return fs.readFileSync(path.join(root, relativePath), "utf8"); }
function check(label, condition) {
  checks.push({ label, passed: Boolean(condition) });
  if (!condition) failures.push(label);
}

const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts || {};
check("Package identity is Yusuf", pkg.name === "yusuf-clothing-line");
check("Identity gate script exists", typeof scripts["verify:identity"] === "string");
check("Readiness gate is wired as a package script", typeof scripts["verify:clone-readiness"] === "string");
check("Production build runs both static gates", /verify:identity/.test(scripts.build || "") && /verify:clone-readiness/.test(scripts.build || ""));
check("Project instructions and implementation notes exist", exists("AGENTS.md") && exists("README.md") && exists("docs/PWA-FOUNDATION.md"));
check("Identity config exists", exists("scripts/identity.config.json"));
check("Identity verifier consumes config", /identity\.config\.json/.test(read("scripts/verify-identity.mjs")));
check("Firebase CLI configuration wires the target rule files", /firestore\.rules/.test(read("firebase.json")) && /storage\.rules/.test(read("firebase.json")) && /firestore\.indexes\.json/.test(read("firebase.json")));
const indexes = JSON.parse(read("firestore.indexes.json"));
check("Firestore index file has valid CLI structure", Array.isArray(indexes.indexes) && Array.isArray(indexes.fieldOverrides));
const manifest = JSON.parse(read("public/manifest.webmanifest"));
check("Static manifest identity matches target", manifest.name === "Yusuf Clothing Line | Tailoring & Alterations" && manifest.short_name === "Yusuf Clothing");
check("Generated manifest exists", exists("src/app/manifest.ts"));
check("PWA registration and service worker exist", exists("src/app/pwa-register.tsx") && exists("public/sw.js"));
check("Customer storefront uses editable catalogue", /TailoringServiceCatalog/.test(read("src/app/page.tsx")));
check("Customer request form uses dedicated tailoring collection", /tailoringRequests/.test(read("src/app/request/request-form.tsx")));
check("Customer request form uploads to owner-scoped path", /tailoringReferences\//.test(read("src/app/request/request-form.tsx")) && /uploadBytes/.test(read("src/app/request/request-form.tsx")));
check("Customer history reads private request records", /tailoringRequests/.test(read("src/app/account/customer-account.tsx")));
check("Quote acceptance verifies the signed-in customer server-side", /verifyIdToken/.test(read("src/app/api/tailoring-request/accept-quote/route.ts")) && /data\.customerId !== user\.uid/.test(read("src/app/api/tailoring-request/accept-quote/route.ts")));
check("Admin workspace implements catalogue and request CRUD", /setDoc/.test(read("src/components/TailoringAdminDashboard.tsx")) && /deleteDoc/.test(read("src/components/TailoringAdminDashboard.tsx")) && /updateDoc/.test(read("src/components/TailoringAdminDashboard.tsx")));
check("Firestore rules use a deny-all fallback and tailoring collections", /match \/tailoringServices\//.test(read("firestore.rules")) && /match \/tailoringRequests\//.test(read("firestore.rules")) && /allow read, write: if false/.test(read("firestore.rules")));
check("Storage rules keep customer reference paths private", /match \/tailoringReferences\//.test(read("storage.rules")) && /request\.auth\.uid == uid/.test(read("storage.rules")) && /allow read, write: if false/.test(read("storage.rules")));
check("Admin bootstrap uses Yusuf-only project and secret names", /YUSUF_OPERATIONS_WORD/.test(read("src/app/api/operations-login/route.ts")) && /yusuf-clothing-line/.test(read("src/app/api/operations-login/route.ts")));
check("Firebase rule deployment is manual-only and target-guarded", /workflow_dispatch/.test(read(".github/workflows/firebase-rules-deploy.yml")) && !/^\s*push:/m.test(read(".github/workflows/firebase-rules-deploy.yml")) && /yusuf-clothing-line/.test(read(".github/workflows/firebase-rules-deploy.yml")));
check("Inherited scheduled production reminder workflow is absent", !exists(".github/workflows/pickup-reminders.yml"));
check("Inherited app icons are absent", !exists("public/plug-icon.svg") && !exists("public/plug-icon-192.png") && !exists("public/plug-icon-512.png"));
check("Legacy sourcing and UploadThing APIs are removed", !exists("src/app/api/sourcing-request/route.ts") && !exists("src/app/api/sourcing-request/approve-quote/route.ts") && !exists("src/app/api/uploadthing/route.ts"));
check("No committed Firebase private key material", !/-----BEGIN PRIVATE KEY-----/.test(read("README.md")) && !/-----BEGIN PRIVATE KEY-----/.test(read(".env.example")));

const routes = [
  ["src/app/book/page.tsx", "/request"],
  ["src/app/order/page.tsx", "/request"],
  ["src/app/saved/page.tsx", "/"],
  ["src/app/orders/[id]/page.tsx", "/account"],
  ["src/app/requests/[id]/page.tsx", "/account"],
  ["src/app/products/[id]/page.tsx", "/request"],
  ["src/app/admin/storefront/page.tsx", "/admin"],
  ["src/app/admin/community/page.tsx", "/admin"]
];
for (const [file, destination] of routes) check("Legacy route compatibility redirect " + file, exists(file) && read(file).includes(destination));

if (failures.length) {
  console.error("YUSUF CLONE READINESS FAILED");
  for (const failure of failures) console.error(" - " + failure);
  console.error(checks.filter(item => item.passed).length + "/" + checks.length + " checks passed.");
  process.exit(1);
}
console.log("YUSUF CLONE READINESS PASSED — " + checks.length + " static architecture checks.");
