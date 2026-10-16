# Product and campaign copy audit — 16 October 2026

Scope: the PR114 review candidate; no main merge, stable/production frontend, Supabase deployment, schema, secrets or billing activation. Public copy must describe the candidate and clearly identify beta/activation limits. Repository code and tests take precedence over older marketing descriptions.

| Subject | Evidence | Public wording |
| --- | --- | --- |
| Initial access | `app/domain/entitlements.ts`, `docs/BETA_ROLLOUT_CHECKLIST.md` §5. Initial Free capabilities include Booking Core, public profile/form, basic calendar/distribution and basic Passport. Active-booking capacity is represented as5; billing/paid checkout is not activated. | Initial plan includes booking management, public profile and basic Passport. No promise of unlimited capacity, no-card signup, setup time or free lifetime service. |
| Public profile/enquiry | `PublicArtistProfile.vue`, `PublicBookingForm.vue`, `get-public-artist-profile`, `submit-booking-request`. Public requests do not require promoter auth. | Introduction, sound/links, booking entry. Instagram/WhatsApp are shared links, not automatic DM imports. |
| Passport | `CUE_PASSPORT_V1.md`, checklist §4, workspace confirmed-booking source and public summary/visibility. Code complete, staging deployments documented; manual beta gates remain. | Basic Passport is built from confirmed bookings. Public visibility is controlled by the artist; advanced/media capabilities depend on plan. No longer called a future concept; no blanket production readiness claim. |
| CUE ID | Existing laboratory/model instructions and home in-development copy. | Secondary mention, explicitly in development. Existing avatar assets remain available; no editor/model changes. |
| Agency catalogue | Settings publication/artist visibility, `/agency/:slug`, public endpoint and enquiry tests. Actual route rendered with fixtures in earlier PR114 checks. No independent hosted production publication acceptance in this task. | Conditional beta wording: when the agency publishes its catalogue, only its chosen visible roster is shown; promoters can enquire without registering. No claim that every new agency already has a published catalogue. |
| Email/AI | `ConnectedMailboxPanel.vue`, `MailboxBetaNotice.vue`, latest handoff, supported-file tests and staging acceptance notes. Requires approved mailbox, connection and enabled detection; limited beta places. | Not included automatically on registration. Review/decision stays with user. No invented automatic approval, setup time, billing or unrestricted access. |
| Attachments | Current email/provider implementation and 15 October accepted supported-file staging evidence. PDF/PNG/JPG supported; bounded file/count/transport limits and unsupported-file notices. Production parity was not promoted/checked here. | Beta scope; compatible formats within workspace limits. Other formats may not import. Remove obsolete blanket “attachments not implemented” and duplicate conceptual warnings; keep one clear illustrative-demo notice. |

## Campaign funnel

- DJ ads → `/dj`; agency ads → `/agency`. Existing `signup_click` retained with `landing_{audience}_{placement}` and audience; no parallel click event added.
- Shared public campaign helper filters `ref` and five UTM fields (string/length checks; referral validation). Home→landing, cross-audience, menu/auth and CTA paths retain these fields to `/access`; arbitrary query data is not carried forward.
- Existing `signup_started` and `signup_completed` are emitted by access. `signup_completed` means the sign-up API accepted the request; it can still require email confirmation. It is not an activation event.
- Useful activation signals already exist: `artist_profile_published` after successful publication; `booking_capture_created` after a booking is created. Use the earliest qualifying event in the consented analytics reporting scope as the first useful activation; do not emit a second frontend “first activation” event for the same action. Existing dashboard also aggregates persisted beta activity; this is separate from marketing/GTM analytics and unchanged.
- Marketing events go through existing `useAnalytics.track`: consent must be granted and a GTM ID configured. Tests execute the real guard and landing composable, asserting no event before/after consent denial, one tag script, one CTA event and attribution allowlisting. Browser testing uses a fixture GTM ID and intercepts its script, never submitting synthetic conversion traffic to a real analytics account.
- Activation payloads contain fixed source values/booleans, not proposal text, message body, contact, fee or booking ID. No new booking-data payloads added.
- Live GTM/GA container conversion definitions, first-event reporting/cohort setup and cross-device identity are external configuration and are not established by passing code/fixture tests. No tag/container is changed in this task. Record preview configuration/delivery limitations separately from code verification.

## Captures

Twenty screenshot files under `public/images/product/`: actual compiled workspace/public-profile UI in ES/EN and both themes. All identity, artist, contact, booking and message values come from the local fixture in `capture.cjs`; `.invalid` addresses, ORBIT/NOVA and entities are artificial. No real account, Supabase data, outgoing messages or hosted publication is used. The public profile uses its real published-profile route/template with an intercepted fixture response and public Passport visibility off; this is not a separately published live artist account.

Views: roster with artist filter, booking conversation, confirmed-date calendar, public-profile introduction, sound/links. They illustrate current UI, not invented integrations. All screenshots have full-size links on the landings for mobile readability.

Reproduce from repo root with the documented Node toolchain/browser module, a local static build configured with `NUXT_PUBLIC_SUPABASE_URL=https://agency-ux-fixture.invalid` and fixture public key, and a static server on4182:

```sh
node docs/reviews/commercial-product-review/capture.cjs
```

Override `CUEBOOKER_PLAYWRIGHT_MODULE`, `CUEBOOKER_CAPTURE_ORIGIN`, `CUEBOOKER_CAPTURE_OUTPUT` as needed. It only intercepts fixture provider calls and writes screenshots to `/tmp/cuebooker-product-captures` by default. Encode the selected1440×1050 JPEGs to WebP quality86 under `public/images/product/`. No tracked application data or dependencies are changed by the capture script.

Native public-profile light-mode capture found unreadable inherited ink on fixed dark editorial surfaces. The public component now scopes readable text/border tokens to those surfaces and uses theme-aware CTA ink. No profile/intake logic changed; screenshots were regenerated after the CSS correction.
