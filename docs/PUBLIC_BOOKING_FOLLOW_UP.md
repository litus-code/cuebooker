# Cuebooker Public Booking Follow-up & Distribution

Updated: 17 September 2026  
Status: ACTIVE PRODUCT / ARCHITECTURE CONTRACT

This document extends `BOOKING_INGRESS_PRODUCT.md` with what happens after a public enquiry and how the same public booking surface is distributed through external channels.

## 1. Principle

A promoter should not need a Cuebooker account to start or continue a booking conversation.

The public flow is:

```text
Artist profile / attributed link / embedded widget
 -> public booking form
 -> Booking Core
 -> acknowledgement
 -> secure follow-up link and/or email reply
 -> Activity thread in the same Booking
```

There is no promoter-side duplicate Booking model.

## 2. Acknowledgement

After a successful public enquiry Cuebooker attempts an acknowledgement email.

The Booking remains valid even if email delivery is unavailable.

The acknowledgement is a system action:

```text
created_by = null
purpose = public_acknowledgement
```

It must never be falsely attributed to the workspace owner or manager.

The email may be answered directly using the existing `booking+<reply_token>@...` thread routing.

## 3. Secure follow-up link

The acknowledgement can carry a bearer link:

```text
/request?token=<random-token>
```

Rules:

- token has 256 bits of randomness;
- only SHA-256 of the token is persisted;
- raw token is never written into Activity, Booking or stored email body;
- generated links currently expire after 180 days;
- links can be revoked/replaced;
- response payload is a strict public projection;
- secure-link replies are idempotent.

The follow-up view can expose:

- artist name;
- public booking status;
- event/venue/date/location/current submitted offer;
- conversation items that belong to the external promoter thread.

It must not expose:

- workspace IDs;
- private fee policy;
- internal notes;
- Holds;
- Next Moves;
- private calendar/availability;
- other contacts/bookings;
- internal-only Activity.

## 4. External reply semantics

A promoter reply from the secure link becomes:

```text
Activity
type = note
direction = inbound
created_by = null
metadata.ingested_by = public_follow_up
```

A promoter reply by email becomes an inbound email Activity through the existing booking email ingestion path.

Neither path directly changes `Booking.status`.

Status remains operational truth controlled by the artist/manager/workspace. This prevents a public bearer link from mutating critical internal state.

## 5. Public status language

Internal statuses may be translated into promoter-safe language, for example:

```text
new              -> Solicitud recibida / Enquiry received
in_conversation  -> En conversación / In conversation
waiting_response -> Esperando respuesta / Waiting for reply
confirmed        -> Fecha confirmada / Date confirmed
rejected         -> No seguirá adelante / Not moving forward
cancelled        -> Cancelado / Cancelled
```

Do not expose internal operational jargon when a clearer public phrase exists.

## 6. Attributed share links

The artist workspace can generate multiple URLs without creating multiple booking channels.

Examples:

```text
/<slug>
/<slug>?booking=1
/<slug>?booking=1&src=instagram
/<slug>?booking=1&src=whatsapp
/<slug>?booking=1&src=website
/<slug>?booking=1&src=epk
/<slug>?booking=1&src=qr
/<slug>?booking=1&src=email
/<slug>?booking=1&src=link_in_bio
```

`src` is attribution only. It does not redefine booking origin.

For a public form:

```text
origin_channel = booking_form
capture_method = public_form
entry_source = <src when known>
```

## 7. Embedded widget V1

Cuebooker V1 uses a hosted iframe rather than a JavaScript SDK:

```html
<iframe
  src="https://cuebooker.com/<slug>?embed=1&booking=1&src=website"
  title="Cuebooker booking"
  loading="lazy"
  style="width:100%;height:760px;border:0;"
  sandbox="allow-scripts allow-forms allow-same-origin">
</iframe>
```

Why iframe first:

- same real public intake contract;
- no duplicated widget backend;
- host-site CSS cannot break the booking form;
- no private workspace identifiers;
- fewer supply-chain/integration risks than an early SDK;
- can later gain auto-resize or a small loader script without changing Booking Core.

The embed defaults `entry_source=website` when no explicit source is provided.

Embed mode is not a second public profile. It is a compact rendering mode of the same artist/form route.

## 8. Publication rules

Share and embed tools depend on profile state:

- profile URL is shareable when the profile is published;
- direct booking/share/widget actions require `accepting_requests=true`;
- closing booking does not need to remove the public artist profile.

This keeps public identity separate from temporary booking availability.

## 9. Current staging implementation

Implemented on `feature/app-visual-system` and staging only:

- hashed follow-up access;
- safe follow-up RPC;
- idempotent public reply RPC;
- `booking-follow-up` Edge Function;
- real `/request?token=...` page;
- system-origin acknowledgement records;
- direct-email reply compatibility for system-origin acknowledgement;
- share-link generator in Profile;
- iframe widget rendering mode + copied embed snippet.

Known staging infrastructure gap:

```text
submit-booking-request acknowledgement email
 -> failure_code = provider_not_configured
```

The deployed function currently does not receive `BREVO_API_KEY` in staging. Booking creation itself is unaffected, and an undeliverable secure access is revoked.

Do not claim email delivery is fully proven until staging provider configuration is fixed and a safe delivery smoke succeeds.

## 10. Production gate

Before production:

1. configure and smoke acknowledgement provider delivery on staging;
2. visually smoke public follow-up + widget desktop/mobile;
3. add stronger anonymous abuse/rate protection;
4. verify CSP/frame policy for embedded widget on real external origins;
5. run Supabase security/performance advisors;
6. explicit production migration/function review.

Production is not authorized by this document.
