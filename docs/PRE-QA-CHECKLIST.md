# Yusuf Clothing Line — pre-QA checklist

This checklist separates checks that run in GitHub Actions from checks that require a configured Firebase project, a deployed site, or a real device.

## Automated repository checks

- [ ] `npm ci` completes.
- [ ] `npm run verify:identity` passes.
- [ ] `npm run verify:clone-readiness` passes.
- [ ] `npm run verify:security-boundaries` passes. These are source-level regression guards, not a penetration test or proof that Firebase rules are deployed.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

## Customer journey

- [ ] Browse active services and confirm deactivated catalogue items no longer appear.
- [ ] Open a service from the catalogue; confirm the request form preselects it.
- [ ] Submit a request with no image, then another with a supported image under 5 MB.
- [ ] Confirm acknowledgement language does not imply an accepted quote, confirmed order, paid deposit or appointment.
- [ ] Try a past, impossible or malformed fitting date; it must be rejected.
- [ ] Try submitting a deactivated service from a stale browser tab; the server should reject it and ask the customer to refresh.
- [ ] Verify customer account linking preserves the anonymous customer's own request history.
- [ ] Verify a customer cannot read another customer's request or accept their quote.

## Admin operations

- [ ] Sign in using the configured Yusuf operations setup.
- [ ] Create, edit, deactivate and delete a service; confirm the customer catalogue follows those changes.
- [ ] Create and issue a quote, then accept it as the owning customer.
- [ ] Update fitting date, due date, production stage, deposit and payment status.
- [ ] Confirm status labels distinguish request review, quote acceptance, order confirmation, payment and collection.
- [ ] Confirm private reference images are visible only to authorized staff and are not publicly cacheable.
- [ ] Confirm catalogue changes do not rewrite historical request snapshots.

## PWA and infrastructure

- [ ] Confirm the install control invokes the native prompt when the browser exposes it; installation is optional.
- [ ] Check manifest name, icons, theme, start URL and unique Yusuf cache namespace.
- [ ] Test normal navigation and offline fallback on Android/Chromium and iOS/Safari separately.
- [ ] Verify Firebase Authentication providers, server environment variables and service-account project ID.
- [ ] Deploy Firestore/Storage rules only after reviewing the actual Firebase project and explicitly authorizing deployment.
- [ ] Verify live persistence, authorization denials and image uploads against the intended Yusuf project.

## Evidence boundaries

A green CI run proves only the automated checks above. It does not prove Firebase rules are deployed, live credentials are correct, an account provider is enabled, uploads work against the real bucket, or install/offline behavior works on a physical device.
