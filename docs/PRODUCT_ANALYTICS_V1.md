# Cuebooker V1 product analytics

Updated: 24 September 2026  
Scope: product behaviour only

This contract defines the application-owned events used to understand activation and the Booking Core loop.

It does not define cookie consent, legal policy, checkout, Stripe or subscription instrumentation.

## Measurement rule

Cuebooker emits events after the corresponding product action succeeds, except events that explicitly describe an attempt such as `signup_started` or `booking_request_started`.

"First" milestones are calculated downstream as the first occurrence of the event for the analysis cohort. The client does not persist `first_* ` flags.

## Privacy rule

Product analytics payloads must not include:

- artist or user names;
- email addresses;
- phone numbers;
- public slugs;
- booking IDs;
- message subjects or bodies;
- free-text notes;
- auth tokens;
- copied URLs or iframe code.

Use categorical state only.

## V1 event contract

### Acquisition and onboarding

`signup_started`

- emitted when account creation is submitted;
- payload: `surface`.

`signup_completed`

- emitted after account creation succeeds;
- payload: `surface`, `email_confirmation_required`.

`onboarding_completed`

- emitted after workspace onboarding succeeds;
- payload: `account_type`, optional `cue_id_next_step`.

### Public presence

`artist_profile_viewed`

- emitted after a public artist profile is successfully loaded;
- payload: `entry_source`, `embed`.

`artist_profile_published`

- emitted after public-profile publication succeeds;
- payload: `source`.

`booking_entry_shared`

- emitted after a distribution action succeeds;
- payload `method` is one of:
  - `profile_link`;
  - `booking_link`;
  - `instagram_link`;
  - `qr`;
  - `embed`.

### Booking activation

`booking_request_started`

- public booking request submission attempt;
- payload: `entry_source`, `embed`.

`booking_request_sent`

- public booking request persisted successfully;
- payload: `entry_source`, `embed`, `confirmation_sent`.

`booking_capture_created`

- manual/CUE booking capture created successfully;
- payload: `source`, `has_date`, `has_city`, `has_venue`.

`booking_response_sent`

- a real outbound booking email was sent successfully;
- payload: `channel`.

`booking_decision_completed`

- an explicit booking decision was persisted;
- payload: `decision`.

`booking_confirmed`

- emitted after explicit confirmation succeeds;
- payload: `source`, `has_city`, `has_venue`.

### Passport activation

`passport_event_created`

- emitted when a confirmed booking has enough location context to enter the Passport trajectory;
- payload: `has_venue`.

### Smart CUE / Smart Capture beta signals

`smart_capture_start`

- emitted when Smart Capture starts analysing text or audio;
- payload: `mode`, plus non-sensitive technical size metadata.

`smart_capture_result`

- emitted when Smart Capture produces a result or fallback;
- payload: `mode`, `success`, optional `fallback`, counts for `missing_fields` and `warnings`;
- never include transcript or extracted free text.

`smart_capture_apply`

- emitted when the user explicitly applies a Smart Capture result;
- payload: categorical `source`, `missing_fields`, `warnings`.

`smart_capture_discard`

- emitted when the user discards a Smart Capture result;
- payload: `missing_fields`, `warnings`.

### Passport Event Media beta signals

`passport_media_add_started`

- emitted when the add-media flow is opened;
- payload: `surface`, `existing_media_count`.

`passport_media_linked`

- emitted after Event Media is linked successfully;
- payload: `media_type`, `source`, `has_permalink`, `has_thumbnail`.

`passport_media_link_failed`

- emitted after a failed link attempt;
- payload: `media_type`, categorical `reason`.

`passport_media_status_changed`

- emitted after linked/hidden state changes successfully;
- payload: `media_type`, `from_status`, `to_status`.

`passport_media_status_change_failed`

- emitted after a failed visibility-state change;
- payload: `media_type`, `from_status`.

### Automation beta signals

`automation_created`

- emitted when a next action is configured to complete on real inbound booking activity;
- payload: `automation_type`, `has_due_at`.

`automation_completed`

- emitted when an automated next action is completed through a user-visible client action;
- payload: `automation_type`, `completion_source`.

Automatic inbound completion itself is a server/domain outcome and must also be measured from the persisted `next_moves.completion_trigger = inbound_activity` plus `completed_at` state. Client analytics alone is not the source of truth for automation execution because analytics consent may be denied or the completion may happen without the workspace being open.

### Commercial product signals

`upgrade_prompt_viewed`

- emitted only when the product can actually send analytics under the current consent state;
- payload: `entitlement`, `target_plan`.

`upgrade_prompt_action`

- emitted when a user activates an action exposed by an upgrade prompt;
- payload: `entitlement`, `target_plan`.

Checkout-started, payment-completed and subscription lifecycle events belong to the billing/checkout integration and are intentionally outside this document.

## Beta feature adoption

During the open beta, Media, Smart CUE and automation adoption should be evaluated independently from monetization.

Primary beta questions:

- what percentage of consenting active users start Smart Capture;
- how often Smart Capture produces a usable result;
- apply vs discard rate;
- repeat Smart Capture usage;
- how many artists link Event Media and how often;
- how many automated next actions are configured;
- how many configured automations eventually complete;
- failure rate by feature.

GA4/GTM events only represent users who granted analytics consent. Operational completion metrics that already exist in Cuebooker's own database should be used alongside analytics when a complete denominator is required.

## V1 funnel

The product-side activation funnel is:

```text
signup_completed
→ onboarding_completed
→ artist_profile_published
→ booking_entry_shared
→ first booking_request_sent OR booking_capture_created
→ first booking_response_sent
→ first booking_confirmed
→ first passport_event_created
→ first upgrade_prompt_viewed
→ first upgrade_prompt_action
```

Do not use raw daily login count as the primary retention metric. Prefer repeat booking work, active booking handling, responses, confirmations and returning operational activity.
