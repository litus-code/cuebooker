# Product definition

Updated: 24 September 2026

## Problem

Booking enquiries arrive through unrelated channels. The DJ or manager loses context, repeats questions, forgets follow-ups and risks accepting overlapping dates. Existing tools often assume a full agency workflow, event ticketing or a marketplace. CueBooker starts at the moment someone wants to hire an artist.

## Initial users

### Independent DJ

The DJ creates an account, publishes a booking link, receives complete enquiries, keeps the conversation attached to each request and sees provisional or confirmed dates in one calendar.

### Manager or agency

The agency creates an account, manages a roster, assigns responsibility and controls private permissions, fees and calendars.

### Promoter, venue or festival

The promoter opens the artist link or embedded widget and submits the first request without registering. The response arrives by email. A secure link returns the promoter to the same thread. An account can remain optional until repeated use makes it useful.

## Entry channels

An artist without a website shares a CueBooker URL through Instagram, Linktree, WhatsApp, email or a QR code. Channel-specific URLs may record the source.

An artist with a website embeds a universal widget or links to the hosted form. The main product is the hosted service and copy-paste embed. An npm package may exist for development teams, but it is not the default installation path.

## Booking lifecycle

The intended states are:

| State | Trigger | Type |
|---|---|---|
| New | Promoter submits a request | Automatic |
| In review | DJ or manager opens it | Automatic |
| Waiting for promoter | DJ or manager sends a reply | Automatic |
| Confirmed | DJ or manager confirms the date | Manual |
| Rejected | DJ or manager rejects the request | Manual |

Sending a draft or opening a message must not move the booking to “Waiting for promoter”. The state changes only after the reply is successfully sent.

Confirmation adds the event to the calendar. Rejection closes it but keeps the record in history. Archiving is reversible.

## Calendar

The calendar shows a full month, status colours and a selected-day schedule with all 24 hours. It warns about overlapping provisional and confirmed events before confirmation. A warning informs the user and does not silently make the commercial decision.

Private details stay inside the workspace. Public discovery can expose an availability signal only when the artist opts in.

## Pricing and discovery

An artist or agency stores private fees for matching and internal decisions. Public search can filter by budget without showing the exact fee.

The future directory depends on a useful supply of opted-in DJs. It supports date, city, sound and budget. This is a later layer because a directory without enough artists would weaken the product.

### Initial commercial model

Cuebooker launches as freemium rather than as an expiring trial-only product.

The initial plan structure is:

- Free: one artist, one user and enough real booking capacity to experience the complete workflow;
- Artist Pro: paid operational depth for an active independent artist;
- Agency: paid multi-artist and team operation.

The target initial prices are documented in `docs/MONETIZATION_STRATEGY.md`.

The Free plan must preserve the product loop:

```text
REQUEST
→ CONVERSATION
→ HOLD
→ DECISION
→ BOOKING
→ EVENT
→ CUE PASSPORT
```

Payment should not interrupt confirmation, the first booking, the basic calendar or the creation of a basic Passport. Paid value comes from higher capacity, advanced automation, full history, richer Passport/media presentation, integrations, analytics, exports and multi-artist operation.

The public launch should present Booking Core as the primary product, Artist Profile and CUE PASSPORT as the professional identity/trajectory layer, and CUE ID as optional.

## Artist Profile

CueBooker has one artist profile. It is the single source of truth for the artist identity, professional presentation and booking context. CUE ID and CUE PASSPORT are parts of this profile, not separate profiles or parallel products.

The profile can be started during onboarding and completed later. It records:

- artist identity, biography, city, country, time zone and working languages;
- an optional artist cover with a CueBooker-designed fallback when no image is uploaded;
- music identity, with reviewed styles, substyles and sound descriptors;
- performance formats and suitable event types;
- media, social, technical rider and hospitality rider links;
- private fee range, fee basis, usual set duration, travel regions and equipment notes;
- CUE ID visual representation when the artist chooses to use it;
- CUE PASSPORT trajectory derived from artist-controlled history and real CueBooker activity.

The artist should never need to enter the same identity information twice. CUE ID reads from Artist Profile data and adds visual choices. CUE PASSPORT reads from Artist Profile and booking history and adds trajectory presentation. Commercial terms remain private and must never appear in a public profile without a separate product decision and explicit artist control.

### CUE ID

CUE ID is the visual layer of Artist Profile. It can coexist with photography and artwork instead of replacing them. The long-term presentation modes are expected to include photo, artwork and CUE ID.

The artist can postpone CUE ID indefinitely. A new or established artist must be able to use CueBooker professionally without adopting a 3D avatar.

### CUE SIGNAL

CUE SIGNAL is a discreet contextual indicator derived from meaningful activity. It does not define artistic quality, status in the scene or popularity. It should remain secondary to the profile and booking workflow.

Follower counts, likes, reach, daily logins and repeated app usage do not increase SIGNAL.

### CUE PASSPORT

CUE PASSPORT is a section of Artist Profile that documents trajectory. It can include selected years, residencies, cities, venues, booking milestones and recurring professional relationships. CueBooker should generate as much of this history as possible from real records while allowing the artist to add relevant previous history.

### Share

Sharing is an action from Profile Preview or Passport, not a separate product section. Planned outputs include Instagram Story, artist card, LinkedIn presentation and direct image export. Every output must obey the artist's visibility settings.

### Deferred concepts

CUE CASE remains an exploration for a later visual history treatment. It should not appear as a first-class product area until CUE ID and PASSPORT have demonstrated real value.

## Cultural direction

The Artist Profile must respect club culture and electronic-music history. It does not rank artistic quality, authenticity or popularity. The product should feel credible to an artist starting today and to someone with decades of club history.

Music data must separate broad styles, substyles and sound descriptors so that scene terminology is not reduced to vague or invented labels. Taxonomy remains editorially reviewed and extensible.

CUE ID appears during DJ onboarding as an optional invitation. Skipping it never blocks account creation or booking operations. The current `/cue-id` route is an internal visual laboratory, not a second destination in the final product navigation. The real experience belongs inside Artist Profile.

See `docs/CUE_ID_PRODUCT_VISION.md` for cultural guardrails, taxonomy direction, 3D architecture, delivery phases and success criteria.

## Demo contract

The public demo must state what users are seeing:

- The visitor can open the DJ workspace directly.
- The visitor may optionally simulate the promoter journey.
- Current artists, enquiries, messages and search results are fictional.
- Browser-local interactions demonstrate behaviour and do not represent shared persistence.
- Account access may be enabled per environment when Supabase variables and migrations are configured.

## Validation strategy

The early-access form collects name, email, role and explicit consent. Leads go to the dedicated Brevo list. Interviews and pilot use should test whether users receive enough enquiries to need the workflow, which channels create the most loss, how they decide availability and what must remain private.

Artist Profile adds a second research track: whether DJs across different generations and electronic-music scenes consider the identity system credible, whether experienced artists feel represented rather than gamified, whether artists complete more of their professional profile, and whether shared profile artifacts create qualified visits.
