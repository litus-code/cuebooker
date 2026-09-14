# CueBooker agent guide

Read this file before changing the project. Then read the documents in `docs/`.

## Product in one sentence

CueBooker is a booking workspace for independent DJs, managers and agencies. It turns enquiries from Instagram, WhatsApp, email, phone calls or a website into trackable bookings with one conversation, one status and one calendar entry.

## Product boundaries

The initial product manages demand that a DJ or agency already receives. It does not promise to find gigs.

DJs and agencies have accounts and private workspaces. A promoter can send the first enquiry without creating an account. Follow-up happens through email and a secure booking link.

A public DJ directory and availability search may become a later network layer. Keep private fees and private calendar details hidden. Artists decide whether their availability is discoverable.

## Current public experience

The landing page explains the problem, the workflow, integrations, user roles, access model, demo boundaries, future discovery and early access.

The public demo opens the DJ workspace directly without registration. A separate promoter simulation explains how a request reaches that workspace. Demo records are fictional and remain local to the browser until the persistence block is connected.

## Working rules

- Keep Spanish and English copy aligned.
- Preserve the visual system: dark editorial interface, fluorescent yellow accent, compact mono labels and CSS-drawn arrows.
- Never use emoji arrows.
- Mobile is a first-class layout. Check 390 px width and desktop before merging.
- Do not claim a simulated feature is connected.
- Do not expose artist fees or private calendar details in discovery.
- Do not require promoter registration for the first enquiry.
- Apply database changes through versioned Supabase migrations.
- Enable RLS on every exposed table and grant only the required operations.
- Use exact package versions for security-sensitive clients.
- Run `npm ci`, `npm run typecheck`, `npm run generate` and `npm audit --omit=dev --audit-level=high` before merging.

## Repository map

- `app/pages/index.vue`: landing page and product explanation.
- `app/pages/app.vue`: DJ and manager workspace demo.
- `app/pages/artist.vue`: public artist entry point.
- `app/pages/request.vue`: promoter-side request flow.
- `app/composables/useBookingDemo.ts`: current browser-local demo state.
- `app/domain/booking.ts`: booking statuses and transition rules.
- `app/components/BrevoPilotForm.vue`: early-access lead form.
- `content/es/home.json` and `content/en/home.json`: landing copy.
- `assets/css/main.css`: shared visual system and responsive rules.
- `supabase/migrations/`: identity, memberships, permissions and future product data.
- `.github/workflows/`: CI, staging and production deployments.

## Documentation

- `docs/PRODUCT.md`: audience, problem, product model and decisions.
- `docs/ARCHITECTURE.md`: technical structure, security and deployment.
- `docs/STATUS.md`: implemented, prepared and pending work.
- `docs/ROADMAP.md`: recommended implementation order.
