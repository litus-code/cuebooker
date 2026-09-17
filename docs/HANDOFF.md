# Cuebooker living handoff

Updated: 17 September 2026
Branch: `feature/app-visual-system`
Status: ACTIVE BATON PASS

Read this immediately after `AGENTS.md`. This document records current implementation truth. Always query the live branch HEAD before modifying code because this file can itself be the newest commit.

## 1. Current revision anchors

Last functional Booking Core cleanup before the public-ingress block:

```text
2c6337aff199caa550317b642585fe2b8b283e5b
Remove completed Booking Core migration helpers
```

Public Artist Profile / public booking ingress functional integration commit:

```text
4a7888c63d5c57deaa6885d299c17231406d650b
Integrate public artist profile into workspace
```

That commit was produced by a temporary guarded workflow only after `npm test` and `npm run generate` passed. The temporary workflow and patch helper deleted themselves in the same commit and must not be restored.

A documentation commit may exist after the functional hash above. Always inspect live HEAD.

## 2. Product truth

Cuebooker manages booking demand that an artist, manager or agency already receives. It does not promise to find gigs.

The operational model is one Booking Core with many ingress mechanisms. Never create separate inboxes or booking models per channel.

Canonical principle:

```text
Any professional opportunity, wherever it starts,
converges into the same Booking Core without losing provenance.
```

Current private operational loop:

```text
+CUE
 -> Contact / Counterparty
 -> Booking
 -> Activity
 -> Next Move
 -> Hold
 -> Overview attention
 -> Calendar projection
 -> History
```

Search/Filters, Archive/Restore and conflict diagnostics are real. CUE ID / Passport / 3D identity work remains intentionally downstream.

## 3. Public entry product — fixed definition

Canonical product definition: `docs/BOOKING_INGRESS_PRODUCT.md`.

The public professional identity is the artist profile itself:

```text
cuebooker.com/<artist-slug>
```

Example deep link:

```text
/<artist-slug>?booking=1&src=instagram
```

The model is:

```text
Public Artist Profile
  -> Booking Form
  -> secure public intake boundary
  -> Contact / Counterparty
  -> Booking
  -> initial inbound Activity
  -> authenticated Booking board
```

The promoter does not need an account for the first enquiry.

The embedded website widget will reuse the same intake contract/backend. It must not become another inbox or domain model.

`+ CUE` remains the private capture path for enquiries that happen in WhatsApp, Instagram DM, phone, in person, manager conversations, etc.

## 4. Provenance semantics

Keep these facts separate:

```text
origin_channel  = where the opportunity/conversation originated
capture_method  = how it entered Cuebooker
entry_source    = public-link/form attribution when known
```

Examples:

```text
Instagram bio -> public form
origin_channel = booking_form
capture_method = public_form
entry_source = instagram

WhatsApp conversation -> artist enters +CUE manually
origin_channel = whatsapp
capture_method = manual

Direct email -> future automatic import
origin_channel = email
capture_method = email_import
```

Do not overload `origin_channel` with referral attribution.

## 5. Public-ingress database foundation — STAGING ONLY

Applied to Supabase project:

```text
cuebooker-staging
project id: lycprjeuuynfzwskycwv
```

Migrations currently applied and versioned in repo:

```text
20260917113205_add_public_booking_ingress_foundation.sql
20260917113340_harden_public_booking_submission_rls.sql
20260917113403_index_public_booking_ingress_foreign_keys.sql
20260917114038_reserve_public_artist_slugs.sql
```

The foundation includes:

- public-profile enablement;
- artist -> booking-workspace routing;
- public entry attribution;
- idempotency storage;
- truthful system/anonymous actor semantics instead of impersonating the owner;
- atomic `create_public_booking` command;
- private Booking Core RLS remains strict;
- system/product route slugs are reserved at database level.

Known reserved application names include routes such as `workspace`, `access`, `onboarding`, `app`, `request`, `api`, `cue-id`, `admin`, `settings`, `login`, `signup`, `account`, `auth`, `book`, `booking`, and `artists`.

## 6. Public-ingress database validation already completed

Validated on staging:

- `create_public_booking` is executable by `service_role` only;
- `anon` cannot execute it;
- `authenticated` cannot execute it directly;
- first request creates Contact / optional Counterparty / Booking / Activity atomically;
- retry with the same idempotency key returns the same Booking and does not duplicate;
- new public booking status is `new`;
- `origin_channel = booking_form`;
- `capture_method = public_form`;
- `entry_source` is persisted independently;
- initial Activity is inbound;
- anonymous/system-created records are not falsely attributed to the workspace owner.

Security advisor is clean for this schema work. The remaining project-level warning is Supabase leaked-password protection being disabled; it predates this block.

Performance advisor FK coverage issues introduced by the new tables were fixed. Fresh-staging `unused_index` INFO notices are not grounds for deleting indexes without real workload evidence.

## 7. Public Edge Functions — STAGING ONLY

Active on staging:

```text
get-public-artist-profile
submit-booking-request
```

Both intentionally use `verify_jwt = false` because they are public product endpoints, not private authenticated APIs.

Security boundary:

- public profile endpoint exposes only a safe projection;
- no `workspace_id`, private fees, private calendar data, contacts or internal notes are returned;
- booking submission validates/normalizes input before using server-side service-role credentials;
- browser never receives the service-role key;
- caller identifies an artist by public slug, not by arbitrary target workspace UUID;
- request payload is size-limited;
- a honeypot exists;
- idempotency is enforced in the database command.

A stronger abuse/rate-limiting layer remains a pre-production requirement.

## 8. Public frontend now in branch

Current real public-profile files include:

```text
app/domain/publicArtistProfile.ts
app/composables/usePublicBooking.ts
app/composables/usePublicArtistPublishing.ts
app/components/PublicBookingForm.vue
app/components/PublicArtistProfile.vue
app/components/PublicProfilePublishingControls.vue
app/pages/[slug].vue
functions/[slug].js
```

`app/pages/[slug].vue` is the real dynamic artist profile route. It reads the safe public projection and can deep-link/open the booking form using query params such as `booking=1` and `src=instagram`.

`PublicBookingForm.vue` is deliberately low-friction. Name, email and enough booking context are the core; event/venue/date/offer details can remain sparse. Do not turn it into a CRM-length form.

## 9. Static hosting / Cloudflare routing

The app currently generates static Nuxt output. A dynamic Nuxt page alone is not enough for reliable direct entry from an Instagram/WhatsApp link.

`functions/[slug].js` is a Cloudflare Pages Function for root-level artist slugs. It:

- ignores reserved system paths;
- validates the slug via the public profile endpoint;
- serves the generated Nuxt shell at the requested root URL;
- injects artist title/description/social metadata through HTMLRewriter;
- routes staging/PR-preview hosts to staging Supabase;
- routes `cuebooker.com`/`www.cuebooker.com` to the production public endpoint when production is eventually gated.

Do not migrate the whole app to SSR just to solve this slice unless a later SEO/rendering requirement proves it necessary.

## 10. Workspace profile integration now implemented

Functional commit:

```text
4a7888c63d5c57deaa6885d299c17231406d650b
Integrate public artist profile into workspace
```

The authenticated Profile surface now uses the new publication model:

- publication status is loaded through `usePublicArtistPublishing()`;
- `Perfil publicado / privado` is separate from `Aceptar solicitudes / booking cerrado`;
- unpublishing closes public booking acceptance first;
- opening booking resolves/uses the real Booking Core workspace route;
- public profile controls expose preview/copy/open actions;
- preview URLs use the current browser origin on staging/PR previews and `cuebooker.com` as the non-client production fallback;
- switching managed artists clears stale workspace/public-route state and reloads the selected artist;
- visual media used by preview is loaded from authenticated artist media without exposing private booking fields.

Most importantly, the old bespoke profile-preview markup has been replaced by the same reusable component used publicly:

```vue
<PublicArtistProfile
  :profile="publicProfilePreview"
  :locale="preferences.locale.value"
  preview
/>
```

Therefore “Vista previa de mi perfil” and the public visitor profile now share one visual/product contract instead of diverging implementations.

## 11. Public/private profile boundary

The reusable preview/public contract includes only public-safe fields such as:

- stage name and slug;
- cover / portrait visual treatment;
- bio;
- city/country;
- languages;
- genres;
- performance formats / event types;
- years active;
- public website/social/music links;
- whether booking requests are currently accepted.

Do not put the following into `PublicArtistProfile`:

- minimum/typical fee;
- private booking terms;
- private calendar;
- internal notes;
- contacts;
- negotiation history;
- private rider/operations data unless deliberately redesigned as a public-safe artefact later.

## 12. Current validation status

The guarded workspace-integration workflow ran:

```text
npm ci
npm test
npm run generate
```

and only committed after they passed.

The resulting bot commit then caused the normal PR `CI` and `Deploy Staging` workflows to report `action_required` with zero jobs. This is not a code-test failure; GitHub did not instantiate jobs for that bot-generated commit.

This handoff refresh is intentionally a normal user-authored repository commit so the standard PR CI/Cloudflare preview can run against the integrated state.

Do not declare the public flow fully validated until the new PR preview is green and the smoke checks below have been performed.

## 13. Exact next validation block

Next agent/session must continue here, not restart product definition.

### A. CI / preview

- resolve live branch HEAD;
- verify normal CI succeeds;
- verify PR Cloudflare preview deploy succeeds;
- record the exact preview URL/hash.

### B. Staging profile smoke

Use only staging artist fixture if still present:

```text
artist_id: 5a89bb6b-48a1-449e-9ead-b44094be6287
slug: lits
workspace_id: 81c84e12-b895-43f4-84ac-5ca417ed8067
```

Temporarily enable public profile + accepting requests on staging, then verify the PR preview route:

```text
/lits?booking=1&src=instagram
```

Check:

- direct root URL resolves;
- public profile renders;
- booking form opens/focuses;
- public-safe data only;
- no private fee terms or private calendar data;
- responsive/mobile behavior is viable.

### C. Public submit / board proof

A full HTTP POST from the deployed public form still needs proof. The DB/RPC path itself is already validated, but do not claim the deployed Edge Function POST is end-to-end proven until an actual request is sent through it.

When a real public request is sent on staging, verify:

```text
public form
 -> submit-booking-request
 -> create_public_booking
 -> Contact / Counterparty
 -> Booking(status=new)
 -> inbound Activity
 -> authenticated real BookingCoreInbox
```

Then retry the same idempotency key and verify no duplicate.

### D. Cleanup

After smoke testing, restore the staging fixture to:

```text
public_profile_enabled = false
accepting_requests = false
```

Do not leave the test artist accidentally published.

## 14. Features deliberately after this proof

Once public profile -> form -> real board is proven:

1. promoter acknowledgement email;
2. secure promoter follow-up link;
3. share-link generator with explicit Instagram / WhatsApp / website / EPK / QR attribution;
4. embeddable widget using the exact same intake;
5. additional email/share/AI capture automation.

Do not create new Booking Core models for any of these.

## 15. Homepage/marketing redesign remains deferred

The user wants the commercial home/headline redesigned because it currently lacks enough power, emotional impact and authenticity.

Do that after the public entry product is operational enough to market truthfully. At that point evaluate the home through product positioning, persuasion/decision psychology, emotional clarity, accessibility, advertising impact and authentic club/electronic-music culture. Avoid generic AI/SaaS language and vanity-metric framing.

## 16. Documentation workflow rule

Meaningful implementation blocks must finish by updating this handoff with:

- live functional commit;
- what is actually implemented;
- what was validated and where;
- what remains unverified;
- exact next step;
- production state.

This is how agents resume the project without depending on conversation memory.

## 17. Production gate

Production Supabase project:

```text
qlocooqfdzehogbwcbhr
```

No public-ingress migration, Edge Function deployment or publication toggle from this block is authorized for production yet.

Remain staging-only until CI, public-profile smoke, real public-submit -> real-board proof, abuse controls and explicit production review are complete.
