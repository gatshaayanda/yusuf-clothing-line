# Yusuf Clothing Line

Mobile-first custom-tailoring and alterations platform for Botswana. This repository was initialized from the mandatory `gatshaayanda/the-plug` foundation; inherited features are not considered approved or production-ready until they have been inspected and adapted to this business.

## Product direction

**Customer journey:** discover tailoring services and garment types → choose a style/fabric and describe the work → provide measurements or request fitting help → optionally attach reference images → request a quotation or submit an order when terms are clear → receive an honest acknowledgement → track progress and order history.

**Business operations:** protected admin workspace for service/catalogue CRUD, customer requests, measurements, quotations, fitting appointments, production stages, due dates, deposits/balances, payment status and collection/delivery. Catalogue changes must not rewrite historical order snapshots.

WhatsApp is an optional supplementary contact channel. The normal customer journey must remain inside the app. Prices, lead times, policies and examples must be labelled as illustrative until Yusuf confirms them.

## Local setup

1. Use the Node version specified in `.nvmrc`.
2. Copy `.env.example` to `.env.local`; the public Firebase web configuration is prefilled for the dedicated `yusuf-clothing-line` project. The app deliberately refuses to initialize against other Firebase project identifiers.
3. In Firebase Console, enable **Authentication → Anonymous** for guest request sessions and **Authentication → Email/Password** for cross-device account linking. Configure a Firebase service-account JSON in `FIREBASE_ADMIN_KEY` and a new, strong `YUSUF_OPERATIONS_WORD` in a private local environment. The server-side service account is required for request submission, quote acceptance and operations sign-in. Never reuse another application's access word or service-account credentials.
4. Ensure the service-account JSON `project_id` is exactly `yusuf-clothing-line`. Firebase rules are source-controlled but are **not deployed automatically**; the repository's rules deployment workflow is manual-only.
5. Run `npm ci`, then `npm run dev`. Do not commit `.env.local`, service-account JSON or other credentials.

## Verification

Available initial commands:

```bash
npm run verify:identity
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

A successful build proves only the checks it actually runs. It does not prove Firebase rules are deployed, anonymous authentication is enabled, data persists in the intended project, private image uploads work, push notifications arrive, or PWA installation/offline behavior works on devices.

## Current implementation boundary

The repository is a freshly cloned foundation and is undergoing a controlled identity, infrastructure and workflow reset. Do not treat inherited sourcing/community features, The Plug routes, seeded content, shared operations login, UploadThing, notification jobs or rules as finished Yusuf functionality. See `AGENTS.md` for required inspection, security, implementation and QA gates.
