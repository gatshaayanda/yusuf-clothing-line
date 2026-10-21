# Yusuf Clothing Line — Repository Contract

## Product and ownership
Build a professional, mobile-first custom-tailoring platform for Botswana. The product owner is the final reviewer; the implementation agent must inspect source and prove outcomes without inventing status. The mandatory foundation is `gatshaayanda/the-plug`; do not substitute another repository.

## Workflow
- New project: INSPECT THE PLUG → READ SOP/CHECKLIST → CLONE → RESET IDENTITY/INFRASTRUCTURE → VERIFY → RESEARCH → BUILD → TEST → CHECKPOINT.
- Existing work: INSPECT → PLAN → IMPLEMENT → VERIFY → CHECKPOINT.
- Unexpected results: STOP → inspect actual state → identify root cause → fix → verify.
- Make small, controlled changes. Preserve working behavior. Inspect diffs and run the checks the repository supports. Never claim a test, push, deployment, integration or user journey passed without evidence.
- Do not deploy, change production infrastructure, mutate live data, deploy Firebase rules/indexes, or incur material costs without explicit authorization. The product owner handles Vercel deployment unless explicitly delegated.
- Report repository, branch, commit, actual changes, test outcomes, blockers and next action. Use PASS / FAIL / NOT RUN / BLOCKED precisely.

## Required clone/reset procedure
Read `CLONING.md`, `AGENTS_REPO_LABELED.md`, `docs/ADMIN-HUB-APP-FACTORY-SOP.md`, and `docs/CLONE-RESET-CHECKLIST.md` in The Plug source repository. If a file is missing on the checked-out branch, locate it on the documented branch or stop and record the mismatch. Do not assume a failed `cat` means the file does not exist in every branch.

Before adapting features, inspect Git state/history/remotes, routes, APIs, Firebase client/admin initialization, rules/indexes, storage, workflows, environment-variable readers, service worker, both manifests, icons, and current CI. Classify each inherited subsystem KEEP / ADAPT / REPLACE / EXCLUDE with evidence. Do not reuse The Plug's credentials, data, operator identity, production configuration, brand or cache namespace.

## Customer experience
- Customers can explore without being forced to install the PWA or redirect to WhatsApp.
- Support service discovery, garment/style/fabric preferences, alterations, custom requirements, measurements or fitting assistance, reference-image upload, quote requests, order submission/acknowledgement, tracking and history.
- Distinguish quote requests, estimates, accepted quotations, confirmed orders, pending payments, received payments and completed work. Never imply a request is confirmed, paid or accepted unless the system records it.
- Use illustrative placeholder services/prices/photos/lead times where needed, clearly label them as examples, and make business content/policies editable through admin CRUD.
- WhatsApp is supplementary, never required to complete ordinary customer flows.

## Business operations
Provide a secure admin workflow for service/catalogue create, view, edit, deactivate and appropriate deletion; customer requests; specifications and measurements; quotations; fitting appointments; production stages; due dates; deposits/balances; payment status; collection/delivery; useful search, filters and summaries. Catalogue edits must not corrupt historical order snapshots.

## Security and data
- Inspect UI → API/server handler → authz → persistence → rules → customer/admin read path for each flow.
- Enforce admin access server-side and in Firestore/Storage rules; hiding admin links is not security. Default-deny unknown collections and paths.
- Validate form inputs and uploaded file type/size on client and server. Protect customer personal details, body measurements and reference images. Do not log private payloads or secrets.
- Use only the dedicated Firebase project `yusuf-clothing-line`. Never reuse another client's credentials or data. Client Firebase web config is public configuration; service-account keys and provider tokens are secrets and must never be committed or exposed to browser code.
- Do not claim that changing source rules deploys them. Rule deployment and live integration verification are separate gates.
- Treat historic requests/orders as records with snapshots. Never cascade-delete business history because a catalogue item is deactivated or deleted.

## PWA and identity
- **Permanent install standard:** reproduce the approved Africhiko installation experience in `gatshaayanda/africhiko`, adapted only for Yusuf branding/assets. The installation mechanism and lifecycle are protected infrastructure. Keep the compact, branded, dismissible card; on desktop/Android show its install CTA only while a retained `beforeinstallprompt` event exists, and call `prompt()` directly from that click. Never show generic Chrome/Edge menu instructions, a fake prompt, a dead CTA or a custom desktop/Android install explainer when the event is unavailable. iPhone/iPad Safari may receive accurate Share → Add to Home Screen guidance; do not assume `beforeinstallprompt` exists on iOS. Keep mobile safe-area spacing, the embedded-browser handoff, service-worker/update/offline behavior and manifest assets coherent. Any future install-mechanics change requires explicit product-owner authorization and focused verification.
- The installable site must remain usable without installation. Preserve the native `beforeinstallprompt` path where supported; do not replace it with a manual-instructions modal on browsers that offer a native prompt.
- Test Android/Chromium, iOS/Safari and embedded-browser handoff separately. Do not claim an in-page web API can force iOS Add to Home Screen.
- Reset all inherited app names, visible copy, metadata, canonical URLs, manifest identity, icons, Apple metadata, service-worker branding, cache prefixes, notification text and base-URL fallbacks. Keep both `public/manifest.webmanifest` and `src/app/manifest.ts` consistent.
- Give Yusuf a unique service-worker cache namespace. Do not delete caches belonging to unrelated apps. Validate icon file formats and dimensions.

## Research and content
Research Botswana tailoring competitors, published prices/services, fitting and collection practices, and evidence-based UX principles when those findings inform decisions. Cite external claims and distinguish verified facts from assumptions. Seed useful placeholders immediately; never represent invented prices or policies as verified business facts.

## Verification
Run the available identity check, TypeScript, lint, build and diff checks. Test complete customer/admin flows, CRUD persistence, authorization denials, uploads, responsive states and failure/retry behavior. Distinguish source inspection, automated tests, local runtime, and deployed/real-device tests. Update this file when material product or architecture decisions change.
