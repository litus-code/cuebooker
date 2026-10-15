# Cuebooker DJ & Agency landings — Codex handoff (14 Oct 2026)

## Branch and previews
- Feature PR #111 `feature/landings-dj-agency-home21` built upon Home 2.1 PR #110.
- Composite preview-only PR #112 targets main to trigger Cloudflare previews; do NOT merge preview PR or deploy to production.
- Routes: `/dj`, `/agency` (preview URLs under `pr-112.cuebooker-staging.pages.dev`).
- Follow `AGENTS.md`, `docs/HANDOFF.md`, `docs/AGENT_WORKFLOW.md`.

## Commercial direction approved
- DJ sells the public booking profile and ways to distribute the same link: Instagram bio/DM, WhatsApp Business self-configured responses, website widget, QR, direct URL. These are not native automated WhatsApp/Instagram integrations.
- Agency sells artist roster and consolidated booking context.
- Do not advertise "100 users", "100 days", false scarcity or unverified free offers. Beta private is a quiet early-access note, not the hero.
- Keep industrial black + Cuebooker lime, legible typography, mobile responsive, Spanish/English.

## Smart Email Capture
- Design: prominent visual inbox => extraction => reviewable Booking Core request. No redundant three-step list beneath. Email sample and booking request are illustrative only.
- The product contract: authorised inbox; identify likely booking offer; prepare data available in email; user reviews. Never fabricate missing values or claim automatic confirmations.
- User additionally requests email attachments associated to each resulting request. Current marketing demo shows Tech Rider.pdf / Lineup.jpg in both panels, explicitly marked as CONCEPT DEMO / unverified. Do NOT market automatic attachment preservation as a live feature until code and a real end-to-end test validate ingest, storage, association, authorization, preview/download, safety and duplicate handling.
- Investigate actual ingest function and database models. Design implementation only after confirming schema and privacy controls. Check file size/type limits, malware scanning, retention, secure download, RLS, duplicate idempotency and exclusion of non-booking emails.
- Remove or reword any commercial copy that implies automatic attachment handling already works. Demo note currently states it is planned.

## Identity module
- Remove repetition: do not put giant `PROFILE / PASSPORT / CUE ID /` heading and repeat `Perfil público / CUE Passport / CUE ID` directly below. New CSS-generated artwork occupies each card; replace with faithful screenshots/assets from real product when available. Do not fabricate real artist statistics or live features.

## QA before merge
- Run npm tests and Nuxt generate, inspect 320/390/768/1440px, both locales, dark/light, focus/keyboard, buttons/anchors, CSS overflow.
- Review the real app email workflow and attachments before making marketing claims.
- Never merge, deploy production or remove existing unrelated tests without explicit approval.
