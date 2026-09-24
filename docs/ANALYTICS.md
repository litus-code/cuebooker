# Analytics and consent

## Architecture

CueBooker keeps analytics semantics inside the application and uses Google Tag Manager only as the delivery layer.

Flow:

`Nuxt event -> dataLayer -> GTM -> GA4`

The application owns event names and payloads. GTM must not invent product semantics that are absent from the app.

## Consent model

CueBooker currently uses a basic consent model:

- analytics is disabled when `NUXT_PUBLIC_GTM_ID` is empty
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
