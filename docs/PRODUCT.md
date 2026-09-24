# Product definition

Updated: 16 September 2026

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

## Professional artist profile

The authenticated workspace includes an optional artist profile that can be completed after onboarding. It records:

- artist identity, biography, city, country, time zone and working languages;
- an optional artist cover with a CueBooker-designed fallback when no image is uploaded;
- primary and secondary genres, performance formats and suitable event types;
- media, social, technical rider and hospitality rider links;
- private fee range, fee basis, usual set duration, travel regions and equipment notes.

The first three groups prepare future opt-in discovery without publishing them today. Commercial terms remain private and must never appear in a public directory without a separate product decision and explicit artist control.

## Demo contract

The public demo must state what users are seeing:

- The visitor can open the DJ workspace directly.
- The visitor may optionally simulate the promoter journey.
- Current artists, enquiries, messages and search results are fictional.
- Browser-local interactions demonstrate behaviour and do not represent shared persistence.
- Account access may be enabled per environment when Supabase variables and migrations are configured.

## Validation strategy

The early-access form collects name, email, role and explicit consent. Leads go to the dedicated Brevo list. Interviews and pilot use should test whether users receive enough enquiries to need the workflow, which channels create the most loss, how they decide availability and what must remain private.
