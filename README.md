# CueBooker

CueBooker is a booking workspace for independent DJs, managers and agencies.

## Stack

- Nuxt 4 and Vue 3
- Nitro API routes
- Cloudflare Pages preset
- D1-ready lead persistence
- Optional Resend email notification

## Local setup

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env` when connecting email delivery. The contact form stores leads in D1 when the `DB` binding exists and sends an email when `NUXT_RESEND_API_KEY` is configured.
