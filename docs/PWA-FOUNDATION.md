# Yusuf Clothing Line — PWA Contract

This document records the PWA behavior that must remain consistent as the tailoring platform evolves.

## Customer-first rules

- The website must remain usable without installation.
- On supported Chromium browsers, retain the browser's native `beforeinstallprompt` event and invoke it directly from the customer's explicit Install action.
- On iOS/iPadOS, show concise Safari Share → Add to Home Screen guidance; do not claim a web page can force the native sheet.
- Detect embedded browsers and provide a clear Open in browser handoff while preserving the intended route where supported.
- An install prompt or manual instructions must never block browsing or submitting a normal request.
- Offline content is only a cached view. Do not imply a request, quotation acceptance, payment or order update was saved while offline.
- Cache public shell assets only. Never cache private requests, measurements, reference images, account pages or admin content in the service-worker cache.

## Identity and cache isolation

- Keep `src/app/manifest.ts`, `public/manifest.webmanifest`, root metadata and service-worker assets aligned.
- Use the Yusuf icon assets and the `yusuf-clothing-` cache prefix. Delete only obsolete cache generations that use this app's own prefix.
- Keep the shell cache and optional media cache separately versioned.
- Firebase Messaging is optional until VAPID and sender configuration are enabled. A missing messaging configuration must not prevent service-worker installation or offline caching.
- Do not reuse another app's Firebase project, cache keys, notification payloads, icons or scheduled workflows.

## Verification checklist

1. Run `npm run verify:identity` and `npm run verify:clone-readiness`.
2. Run TypeScript, lint and production build checks.
3. Verify actual PNG signatures and 192×192 / 512×512 dimensions; check all icon URLs in both manifests.
4. On a supported Android/Chromium browser, confirm the native install prompt opens from the explicit Install action and that the installed app has the correct name and icon.
5. On iPhone/iPad Safari, verify the Share → Add to Home Screen guidance and complete a real installation separately.
6. Test embedded-browser handoff, offline public shell, private route behavior, reconnect, update prompt and stale content messaging on real devices.
7. Verify Firebase rules, anonymous auth, private uploads and notification delivery separately. Source code and a green build do not prove live integrations work.

## Release boundary

Firebase rules deployment is manual-only. Vercel deployment, Firebase rules/index deployment, live-data changes and notification setup are separate owner-authorized actions.
