# Analytics and consent

## Current audit — 20 October 2026

PR114 is merged and release evidence records the campaign backend deployment. Current
public probes find the collector and protected report RPC on both projects. The
16 October “prepared, not deployed” statements below are historical, not current status.
Production collection was verified live by protected run39439480511 on20October; existing test browsers/facts remain test. Active retention is scheduled daily03:17UTC; first execution remains to be observed.
See [the current audit, evidence and activation gate](reviews/acquisition-analytics-2026-10-20/README.md).
The Beta0.0.15 delivery/report diagnostics migration is prepared, not hosted.


## Architecture

CueBooker keeps analytics semantics inside the application and uses Google Tag Manager only as the delivery layer.

Flow:

`Nuxt event -> dataLayer -> GTM -> GA4`

The application owns event names and payloads. GTM must not invent product semantics that are absent from the app.

## Consent model

CueBooker currently uses a basic consent model:

- external GTM delivery is disabled when `NUXT_PUBLIC_GTM_ID` is empty; the new consented first-party path is described below
- Google Tag Manager is not loaded before the visitor explicitly accepts analytics
- consent is stored locally as `cuebooker:analytics-consent:v2`
- rejecting analytics keeps GTM unloaded
- accepting analytics loads GTM lazily and enables application events
- the footer keeps a permanent control for reopening and changing the choice

This deliberately avoids sending analytics data before consent.

## Environment variable

```env
NUXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

The variable is public by design. A GTM container ID is not a secret.

Use separate GTM containers or environment configuration if staging and production need different destinations. Do not point staging traffic at the production GA4 property by accident.

## Event contract

Initial event names:

- `page_view`
- `referral_landing`
- `signup_started`
- `signup_completed`
- `onboarding_completed`
- `artist_profile_viewed`
- `booking_request_started`
- `booking_request_sent`

Call events through `useAnalytics().track(...)` rather than pushing directly to `window.dataLayer` from feature components.

Example:

```ts
const { track } = useAnalytics()

track('booking_request_sent', {
  artist_id: artist.id,
  source: 'discovery'
})
```

Do not send names, email addresses, phone numbers, free-text messages, tokens or other personal data to GA4.

## GTM setup

When the GTM account is created:

1. Create the CueBooker web container.
2. Configure a GA4 Configuration / Google tag inside GTM.
3. Trigger it only after the CueBooker container has been loaded by consent.
4. Map the application `page_view` event and the product events above.
5. Avoid duplicate automatic page views. If GA4 enhanced measurement or the Google tag already emits SPA page views, disable one source so `page_view` is counted once.
6. Test in GTM Preview and GA4 DebugView before publishing the container.
7. Configure the production `NUXT_PUBLIC_GTM_ID` only after the consent flow and container are verified in staging.

## Follow-up

Once authentication and referral capture are integrated, wire the relevant domain actions to the event contract. Product events should be emitted after the corresponding action succeeds, not merely when a button is clicked, unless the event explicitly represents an attempt such as `signup_started`.

PostHog or another product analytics tool can be evaluated later if funnel/session analysis needs more depth. It should reuse the same application-owned event vocabulary rather than creating a second competing taxonomy.

## Campaign funnel review (16 October 2026, PR114)

The current candidate adds a consented first-party destination alongside GTM. A missing
GTM ID disables external delivery only; it does not disable the optional first-party
collector when the public Supabase connection is configured. Both paths require consent.
Internal feature telemetry now also checks that consent before making a request.

`page_view`, `signup_click` and `signup_started` reuse the application calls. Only the
public acquisition pages enter this collector; paths, UTM/ref/source and placement are
allowlisted codes. Raw URLs, referrers, arbitrary titles, slugs and form fields are not
persisted or added by this change. Router readiness and navigation share deduplication.

The pending `campaign-analytics` Edge Function bounds requests and reuses the existing
HMAC-address rate limiter (short-lived abuse counters, no raw IP in campaign data). Its
write/withdraw RPCs are service-role only. Anonymous visitors cannot write verified
account or workspace milestones. A random browser token hash passed in signup metadata
links a new server-created account to a consented browser. An auth trigger observes the
actual creation, including cases pending email confirmation; an obfuscated response for
an existing account does not become another persisted registration.

The collector, schema and server observers are **prepared, not deployed**. The new
Campaigns tab retains the existing internal-admin gate and reports an unavailable backend
explicitly; it does not fall back to demonstration data or historical attribution.
See [the exact audit, deployment gate and evidence](reviews/campaign-funnel/README.md).
