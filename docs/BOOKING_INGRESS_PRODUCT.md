# Cuebooker Booking Ingress Product

Updated: 17 September 2026
Status: ACTIVE PRODUCT DEFINITION

This document defines how booking opportunities enter Cuebooker.

The product principle is simple:

> Cuebooker does not require bookings to start inside Cuebooker. It makes sure they end up organized inside one Booking Core.

The goal is to support real booking behavior instead of forcing DJs, managers, agencies or promoters into one artificial channel.

---

## 1. Product outcome

Any meaningful booking opportunity should be able to become the same `Booking`, regardless of where it started.

Canonical flow:

```text
Entry point
  -> resolve artist/workspace
  -> resolve/create Contact
  -> resolve/create Counterparty
  -> create Booking
  -> create initial Activity
  -> appear in real Bookings board
  -> Next Move / Hold / Calendar / History
```

There is no separate “widget inbox”, “Instagram booking”, “email booking” or “manual booking” product model.

Those are ingress/capture differences. The operational entity is still `Booking`.

---

## 2. Public Artist Profile is the main public surface

The artist's public Cuebooker identity should be a canonical profile URL:

```text
https://cuebooker.com/<artist-slug>
```

Example:

```text
https://cuebooker.com/litus
```

This is preferred over making `/book/litus` the primary public destination.

Why:

- the visitor first understands the artist, not a cold form;
- an artist without a personal website still receives a professional public presence;
- the profile becomes useful from Instagram, WhatsApp, EPKs, QR codes, SoundCloud, TikTok, Linktree/Beacons, email signatures and other channels;
- the booking form feels like a natural action on the artist profile;
- Cuebooker does not reduce the artist to a transactional form.

A `/book/<slug>` route may exist later as an alias/redirect if useful, but it is not the canonical public identity.

---

## 3. “Vista previa de mi perfil” becomes real product preview

The authenticated workspace action currently understood as “Vista previa de mi perfil” should preview the same public profile that visitors will see.

It must not evolve into a separate mock design.

Desired relationship:

```text
Edit profile in workspace
   -> Preview
   -> same public profile component/data contract
   -> publish/live at cuebooker.com/<slug>
```

Preview may render unpublished draft data while authenticated, but its layout and public/private rules must match the production public surface.

This gives the artist confidence that editing profile data changes the actual public presence rather than an unrelated preview.

---

## 4. Booking capability lives inside the Artist Profile

The public profile includes a clear booking action such as:

```text
Solicitar fecha
Booking enquiry
Request booking
```

The exact copy can be refined later during the brand/marketing pass.

The action can:

- scroll to a booking section;
- open a panel/modal/drawer;
- switch the page into a focused booking state;

The implementation choice is secondary. The important product rule is that the form belongs to the artist public surface.

A promoter does not need a Cuebooker account to send the first request.

---

## 5. Booking deep links

Cuebooker should allow an artist to share links that open the same public profile but focus the visitor toward booking.

Examples:

```text
/litus?booking=1
/litus?booking=1&src=instagram
/litus?booking=1&src=whatsapp
/litus?booking=1&src=website
/litus?booking=1&src=qr
```

A normal public profile link can also carry attribution without forcing the form open:

```text
/litus?src=instagram
```

The workspace should later provide a simple “Share booking link” experience that generates/copies links for common contexts rather than making users hand-edit query parameters.

Possible generated options:

- Instagram bio
- WhatsApp / WhatsApp Business
- Website
- EPK
- QR
- Email signature
- Link-in-bio tools
- Other/custom

The list is a convenience layer, not a closed domain model.

---

## 6. Embedded widget

Artists/managers/agencies with their own website may embed a Cuebooker booking widget.

The widget is not a separate backend or a second inbox.

Conceptually:

```text
Artist website
  -> Cuebooker booking widget
  -> same public intake endpoint
  -> same Contact/Counterparty/Booking/Activity model
  -> same real board
```

The widget may visually adapt to embedding constraints, but the submitted schema and server-side command should be shared with the hosted profile form.

Widget-specific concerns include:

- controlled allowed origins where appropriate;
- responsive embed sizing;
- CORS policy;
- abuse/rate limiting;
- clear Cuebooker attribution/branding policy;
- no exposure of private artist/workspace identifiers.

The widget is optional. An artist does not need a website to receive bookings through Cuebooker.

---

## 7. Private capture through + CUE

Not every booking will enter through a form.

Real-world conversations happen via:

- WhatsApp;
- Instagram DM;
- email;
- phone;
- face-to-face conversation;
- manager communication;
- other messaging channels.

`+ CUE` exists so the artist/manager can capture those opportunities with minimal friction.

Examples:

```text
WhatsApp conversation
  -> + CUE manual capture
  -> Booking

Phone call
  -> + CUE / voice capture
  -> Booking

Instagram DM
  -> + CUE paste/share/manual capture
  -> Booking
```

The user should not need to recreate a huge administrative form merely because the opportunity arrived outside Cuebooker.

Sparse/incomplete Booking remains valid.

---

## 8. Future automated capture adapters

The domain must support more automation over time without changing the Booking model.

Planned/possible capture methods include:

- `manual`
- `public_form`
- `email_import`
- `share_extension`
- `api`
- `ai_capture`
- `system`

Potential future entry mechanisms:

- forwarded/imported email;
- email provider webhook;
- mobile share extension from WhatsApp/Instagram/other apps;
- browser share/paste helper;
- voice transcription;
- agency API;
- calendar/integration generated follow-up;
- other messaging adapters when legally/technically feasible.

Do not build all integrations at once.

The architecture should support them now; implementation should add them vertically according to product value and provider constraints.

---

## 9. Three distinct provenance concepts

Do not collapse these into one field.

### 9.1 `origin_channel`

Where the opportunity or conversation actually originated.

Current values include:

```text
phone
whatsapp
email
instagram
in_person
booking_form
other
```

Examples:

- direct WhatsApp conversation -> `whatsapp`
- public Cuebooker form -> `booking_form`
- incoming email -> `email`

### 9.2 `capture_method`

How the opportunity entered Cuebooker.

Current values include:

```text
manual
public_form
email_import
share_extension
api
ai_capture
system
```

Examples:

- WhatsApp captured manually -> `manual`
- Cuebooker public form -> `public_form`
- imported inbound email -> `email_import`

### 9.3 Entry attribution

Where a visitor reached the public Cuebooker profile/form from, when known.

Examples:

```text
instagram
whatsapp
website
qr
epk
email
link_in_bio
soundcloud
tiktok
direct
other
```

This is marketing/referral attribution, not the origin of the booking conversation.

It should be treated as a hint, not guaranteed truth. Query parameters can be copied, forwarded or stripped.

Do not use entry attribution to overwrite `origin_channel`.

The exact storage shape for attribution can be finalized in implementation impact analysis. It must remain queryable enough for future product analytics without turning the Booking entity into a marketing event dump.

---

## 10. Examples

### Instagram bio -> public profile -> form

```text
Visitor opens /litus?src=instagram
Visitor opens booking form
Visitor submits

origin_channel = booking_form
capture_method = public_form
entry attribution = instagram
```

### Artist website -> embedded widget

```text
Visitor submits embedded widget

origin_channel = booking_form
capture_method = public_form
entry attribution = website
```

### WhatsApp conversation captured manually

```text
Promoter messages artist on WhatsApp
Artist uses + CUE

origin_channel = whatsapp
capture_method = manual
entry attribution = null
```

### Phone call captured by future voice input

```text
Opportunity originates by phone
Artist dictates it into CUE

origin_channel = phone
capture_method = ai_capture
entry attribution = null
```

### Incoming email imported automatically

```text
Promoter emails artist/booking address
Cuebooker imports the message

origin_channel = email
capture_method = email_import
entry attribution = null
```

---

## 11. Public form UX principles

The current demo form is useful as a concept but is too demanding to become the default production form unchanged.

The real form should optimize for completion and useful context, not administrative completeness.

### Minimum information

A production request should be possible with a small required core.

Recommended required fields for the first real slice:

- promoter/contact name;
- reply email;
- event or context/message;

Depending on final UX, date/location may be strongly encouraged or conditionally required when the visitor is explicitly requesting a date, but the system should avoid inventing completeness requirements that reject legitimate early enquiries.

### Optional/secondary information

- phone;
- venue;
- city/country;
- event date;
- capacity;
- offer;
- proposed schedule;
- organization/promoter company;
- attachments.

The UI can progressively reveal fields rather than presenting a long form as a barrier.

### Product goal

A promoter should feel that sending a professional enquiry takes roughly the effort of sending a good message, not filling out enterprise procurement software.

---

## 12. Public profile content boundary

The public Artist Profile should be able to use intentionally public professional fields such as:

- stage name;
- profile/cover imagery;
- bio;
- city/country if published;
- genres/styles;
- performance formats;
- public links to music/social platforms;
- selected public availability messaging if later introduced;
- booking CTA.

Never expose automatically:

- fee min/typical/internal budget expectations;
- private rider URLs unless explicitly marked public;
- contact database;
- booking history;
- negotiation notes;
- Next Moves;
- Holds;
- private calendar blocks;
- private availability details;
- internal Activity;
- private documents/contracts.

Public identity and private operations are related but separate surfaces.

---

## 13. Route ownership and reserved slugs

Because the desired public URL is root-level:

```text
/<artist-slug>
```

Cuebooker must maintain a reserved slug set for application/system routes.

At minimum reserve current/future platform names such as:

```text
workspace
access
onboarding
app
request
api
cue-id
admin
settings
login
signup
account
auth
book
booking
artists
```

The list must be maintained centrally and validated when a slug is created/changed.

Artist slugs are already unique in the current identity model, which is a useful foundation for this route.

The current Nuxt deployment is generated/static on Cloudflare Pages. The implementation phase must choose a reliable strategy for arbitrary public slugs (for example explicit prerendering when profiles publish/change, a runtime route, or another compatible delivery mechanism). Do not assume the desired product URL is automatically supported by the current static build.

---

## 14. Target workspace resolution

A public visitor must never choose or submit a raw `workspace_id` as an authorization mechanism.

Server-side public intake should resolve:

```text
artist slug
 -> artist
 -> active workspace that manages booking for that artist
 -> Booking Core command target
```

This matters especially for agencies where one workspace manages many artists.

If future product rules allow an artist to be managed by multiple workspaces, the routing model must become explicit before enabling ambiguous public intake.

---

## 15. Anonymous actor semantics

The current Booking Core foundation uses `created_by` fields tied to authenticated `auth.users` records.

A public promoter is intentionally not required to have an account.

Therefore a public submission must not be falsely attributed to the workspace owner/manager merely to satisfy `created_by`.

Before the real public form can write Booking Core records, the schema/command model must represent system/anonymous creation explicitly.

The exact implementation should be selected during schema impact work, but the invariant is fixed:

> anonymous public ingress is a real provenance state, not impersonation of an authenticated workspace user.

The resulting Contact represents the promoter/person. That is different from the internal system actor that performed the database transaction.

---

## 16. Public intake security boundary

The browser must not write private Booking Core tables directly.

Use a narrow server/edge boundary that:

1. accepts a public artist slug and allowed public fields;
2. validates lengths/types/formats;
3. resolves artist -> workspace internally;
4. enforces public-booking eligibility/configuration;
5. applies rate limiting/abuse controls;
6. uses an idempotency key to prevent duplicate retries/submits;
7. resolves/reuses Contact and Counterparty safely;
8. creates Booking with `status = new`;
9. sets `origin_channel = booking_form`;
10. sets `capture_method = public_form`;
11. records entry attribution separately;
12. appends an initial inbound Activity;
13. returns only a minimal public acknowledgement/reference;
14. never returns private workspace, contact database or commercial history.

Service-role secrets stay exclusively server-side.

A `SECURITY DEFINER` function must not be exposed casually to anon/public roles. If used internally, it must have deliberate grants and a narrow contract.

---

## 17. Idempotency and duplicate submission

Public requests can be retried because of:

- double click;
- network retry;
- browser retry;
- widget integration retry;
- edge/provider retry.

V1 should include an idempotency token/request id generated client-side and validated server-side.

The same valid idempotency key for the same public artist should return the original submission result rather than create another Booking.

This is separate from business-level duplicate detection (“same promoter sent two similar enquiries”), which can remain advisory/future logic.

---

## 18. What happens after submit

Successful public submission must produce real operational truth:

```text
Public submission
 -> Contact / Counterparty
 -> Booking(status=new)
 -> initial inbound Activity
 -> visible in real Bookings board
```

There is no browser-local demo object in this path.

### Board behavior

At minimum the Booking must appear after the workspace reload/refetches real Booking Core data.

Preferred product behavior is for an already-open workspace to receive/refetch the new Booking promptly (Realtime or another controlled refresh mechanism can be evaluated separately).

Do not build a second “public requests inbox” merely to show these records.

---

## 19. Promoter acknowledgement and follow-up

The first request does not require registration.

After a successful submission, the promoter should receive:

- immediate on-screen confirmation;
- a clear statement that the request was delivered;
- email acknowledgement once the email delivery path is production-ready;
- later, a secure follow-up link to view/reply/provide missing details without creating a Cuebooker account.

The existing booking email infrastructure can be reused where appropriate, but public intake must not be coupled to a specific email provider at the domain level.

The secure follow-up link is not required to block the very first slice that proves public form -> real board, but it is part of the intended entry product.

---

## 20. Attachments

Attachments can be valuable for proposals/riders/event information but should not block the first real vertical slice.

When implemented:

- private storage bucket;
- MIME/type/size validation based on actual content/provider metadata where possible;
- safe filenames/paths;
- no public permanent object URLs for private booking files;
- short-lived signed/authenticated access for workspace members;
- explicit retention/deletion policy.

---

## 21. Product analytics later

Once enough real data exists, the provenance model can answer useful questions such as:

- how many enquiries enter via the public form vs manual capture;
- which public entry sources produce requests;
- which entry sources lead to meaningful conversations or confirmed bookings;
- which channels require the most follow-up;
- conversion from enquiry to confirmation by source/context.

This should remain operational/commercial insight rather than social vanity scoring.

Do not introduce public rankings of DJs based on these metrics.

---

## 22. Feature map

### V1 — Public Artist Profile foundation

- canonical public profile concept at `/<artist-slug>`;
- authenticated preview uses the same public profile contract/layout;
- reserved slug validation;
- intentional public data projection;
- clear Booking CTA.

### V1 — Real public booking intake

- hosted booking form inside public Artist Profile;
- minimal/low-friction required fields;
- server/edge public intake boundary;
- anonymous/system actor semantics;
- artist/workspace routing;
- idempotency;
- Contact/Counterparty resolution;
- real Booking + Activity;
- `origin_channel=booking_form`;
- `capture_method=public_form`;
- entry attribution;
- real board visibility;
- confirmation state.

### V1.1 — Promoter continuity

- acknowledgement email;
- secure promoter follow-up link;
- safe reply/update flow without account creation;
- integrate with existing email threading where appropriate.

### V1.2 — Sharing surfaces

- copy public profile link;
- copy focused booking link;
- source-tagged links for common channels;
- QR generation;
- EPK/link-in-bio usage guidance.

### V1.3 — Embedded widget

- embeddable form/widget;
- same intake contract;
- CORS/origin policy;
- responsive embed;
- source attribution = website/embed context.

### Later capture automation

- natural-language CUE;
- voice CUE;
- share extension;
- richer email import/new-enquiry intake;
- external API;
- supported messaging integrations where feasible.

The domain should not be redesigned for each new adapter.

---

## 23. Explicitly out of scope for this entry block

Do not let this block expand into:

- DJ discovery marketplace;
- global artist ranking;
- follower/reach scoring;
- automated fee publication;
- payment/contract marketplace;
- promoter account requirement;
- CUE ID/Passport UI;
- broad AI automation;
- every messaging provider integration;
- homepage redesign.

The homepage redesign is intentionally deferred until this entry model is sufficiently defined/implemented so marketing can describe real product truth.

When that redesign begins, review it through product strategy, brand, ethical persuasion/decision psychology, advertising impact, accessibility, club-culture credibility, emotional clarity and authenticity. Avoid generic SaaS language and ungrounded claims.

---

## 24. Acceptance criteria for the first technical vertical slice

The first technical slice is complete when, on staging:

1. an enabled public artist can be resolved through a public identifier/slug;
2. an unauthenticated visitor can submit a valid booking enquiry through the protected public intake boundary;
3. the client never receives service-role credentials or private workspace identifiers as authorization primitives;
4. one Contact/Counterparty/Booking/Activity chain is created correctly;
5. the Booking has `status = new`;
6. provenance is correct (`booking_form` + `public_form` + optional entry attribution);
7. retrying the same idempotency key does not create another Booking;
8. a different tenant cannot read the created private records;
9. the real authenticated board shows the new Booking;
10. no browser-local demo storage is involved;
11. security advisors show no new relevant schema issue;
12. the flow is smoke-tested on desktop and mobile;
13. `docs/HANDOFF.md` records the exact implementation and validation state.

Only after this deterministic path works should the same intake be embedded as a widget or enriched by AI.