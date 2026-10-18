import fs from "node:fs";

const failures = [];
const checks = [];
const read = path => fs.readFileSync(path, "utf8");
const check = (label, condition) => {
  checks.push({ label, passed: Boolean(condition) });
  if (!condition) failures.push(label);
};

const createRoute = read("src/app/api/tailoring-request/create/route.ts");
const acceptRoute = read("src/app/api/tailoring-request/accept-quote/route.ts");
const imageRoute = read("src/app/api/tailoring-request/reference-image/route.ts");
const loginRoute = read("src/app/api/operations-login/route.ts");
const firestoreRules = read("firestore.rules");
const storageRules = read("storage.rules");

check("Request creation requires a bearer token", /headers\.get\("authorization"\)[\s\S]{0,100}match\(\/\^Bearer/.test(createRoute));
check("Request creation verifies Firebase ID tokens", /verifyIdToken\(bearer\[1\]\)/.test(createRoute));
check("Request creation is idempotent against duplicate request IDs", /runTransaction[\s\S]*REQUEST_ID_ALREADY_EXISTS/.test(createRoute));
check("Live catalogue rejects inactive or missing services", /catalogue\.docs\.find[\s\S]*active !== true/.test(createRoute));
check("Fitting dates are real calendar dates and not in the past", /isValidFittingDate[\s\S]*getUTCFullYear[\s\S]*botswanaToday/.test(createRoute));
check("Reference images are scoped to the authenticated user and request", /tailoringReferences\/\$\{user\.uid\}\/\$\{requestId\}\//.test(createRoute));
check("Reference images enforce allowed MIME types and 5 MB limit", /image\/jpeg", "image\/png", "image\/webp", "image\/avif"[\s\S]*5 \* 1024 \* 1024/.test(createRoute));
check("Quote acceptance checks request ownership", /data\.customerId !== user\.uid/.test(acceptRoute));
check("Quote acceptance requires a quote in the ready state", /data\.quoteStatus !== "ready"[\s\S]*data\.status !== "quote_ready"/.test(acceptRoute));
check("Private image retrieval requires staff authorization", /Only authorized staff can view customer reference images/.test(imageRoute));
check("Private image retrieval disables caching", /Cache-Control": "private, no-store, max-age=0/.test(imageRoute));
check("Operations login refuses to target another Firebase project", /expectedProject !== "yusuf-clothing-line"/.test(loginRoute));
check("Firestore has a default-deny catch-all", /match \/\{document=\*\*\}[\s\S]*allow read, write: if false/.test(firestoreRules));
check("Customers can only read their own requests", /resource\.data\.customerId == request\.auth\.uid/.test(firestoreRules));
check("Customer requests cannot be deleted through Firestore rules", /allow delete: if false/.test(firestoreRules));
check("Storage restricts customer reference images to owner or admin", /match \/tailoringReferences\/\{uid\}[\s\S]*request\.auth\.uid == uid \|\| isAdmin\(\)/.test(storageRules));
check("Storage has a default-deny catch-all", /match \/\{allPaths=\*\*\}[\s\S]*allow read, write: if false/.test(storageRules));

for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.label}`);
}
console.log(`\nSecurity boundary source checks: ${checks.length - failures.length}/${checks.length} passed.`);
if (failures.length) process.exitCode = 1;
