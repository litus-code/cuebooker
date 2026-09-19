# Cuebooker application visual system

Updated: 16 September 2026
Status: active product direction

## Purpose

Cuebooker is evolving from a generic dark SaaS interface into a recognisable product rooted in club culture while remaining a serious professional booking tool.

The operational product must stay fast, dense and clear. The identity areas may be more editorial and expressive, but they share the same visual system.

## Product layers

### Operational core

- Overview
- Bookings
- Request Detail
- Calendar
- History
- Settings

Priorities: clarity, density, speed, traceability and predictable interaction.

### Artist identity

- Artist Profile
- CUE ID
- Passport
- Preview
- future public profile

Priorities: representation, personality, visual presence and career context.

Artist Profile is the bridge between both layers. CUE ID is part of Artist Profile, never a parallel profile.

## Non-negotiable capabilities

The redesign must preserve and support from the beginning:

- Dark mode and Light mode;
- Spanish and English;
- desktop and mobile as first-class layouts;
- the existing booking workflow and request detail;
- Calendar time slots and 24-hour/day scheduling behaviour;
- overlap and availability logic already present;
- History and traceability back to the original request;
- the guided tour and its existing functional steps;
- profile preview and current Artist Profile data;
- performance and accessibility constraints.

No feature may be removed merely to match a visual mockup.

## Theme direction

### Dark

Primary visual reference for the product identity.

- deep black/graphite backgrounds;
- restrained surface hierarchy;
- thin borders instead of floating cards;
- lime as a signal/selection colour, not permanent decoration;
- red retained as a Cuebooker brand detail;
- monospace used for metadata and system signals;
- strong display typography reserved for key moments.

### Light

Light mode is designed, not inverted.

- white/off-white and warm grey surfaces;
- lilac/purple as the interaction accent;
- red retained as a brand detail;
- lower visual contrast between nested surfaces;
- the same information hierarchy and component geometry as Dark.

## Navigation

Desktop uses a left application rail. It must remain compact and operational rather than becoming a marketing sidebar.

Mobile uses a compact top shell with horizontally scrollable primary navigation. All primary destinations must remain reachable without hidden desktop-only interactions.

## Bookings

Bookings is the operational centre of Cuebooker.

The list should be dense enough to scan dates, venues, cities and statuses quickly. Selecting a request opens its full detail without losing the surrounding context.

The visual redesign must preserve filters, counts, sample data controls and guided tour hooks.

## Request Detail

Request Detail must retain:

- event information;
- date and schedule;
- venue and city;
- offer/fee information;
- promoter/contact information;
- source/booking link;
- status;
- conversation history;
- reply composer;
- confirm/reject actions;
- links or traceability to Calendar and History where applicable.

On desktop, the detail can coexist beside the request list. On mobile, selection should naturally move the user to the detail while preserving a clear path back to the list.

## Calendar

The visual mockups are references, not replacements for existing scheduling behaviour.

Cuebooker must preserve time as a first-class dimension. The Calendar must continue to support date selection, start/end times, 24-hour day inspection, status-coded blocks, private labels and editing of existing time blocks.

A future week view may make time even more visible, but the current functional model must not be lost during redesign.

## History

History is a professional trace, not a decorative activity feed.

Every historical item should remain able to return to its originating request where data exists. Filters and status context remain part of the product.

## Guided Tour

The guided tour remains part of onboarding and product education.

The tour should adopt the new visual system while preserving its existing sequence and target hooks. It must stay compact on mobile and must never cover the main action it is explaining when an alternative placement is available.

## Artist Profile and CUE ID

Artist Profile remains the single identity source.

CUE ID is a visual representation option alongside Photo and Artwork. The planned CUE ID system uses a credible humanoid base with modular body type, build, outfit, accessories, pose and visual treatment.

Do not represent people through primitive geometry in production. Procedural primitives are acceptable only for internal renderer tests.

## Responsive rules

Mobile is designed in parallel with desktop.

- touch targets should remain comfortably tappable;
- no important capability may depend on hover;
- long filter/navigation groups may scroll locally instead of forcing page-level horizontal overflow;
- request detail must reflow to one column;
- guided tour must remain readable without obscuring the entire viewport;
- Calendar must preserve usable date/time interaction on narrow screens;
- CUE ID may reduce 3D quality or fall back to a static render based on device capability.

## Performance

Performance is part of Definition of Done.

Public/indexable pages target excellent Core Web Vitals and PageSpeed scores. The private workspace is not an SEO surface, but it follows the same engineering discipline for responsiveness, battery use and perceived quality.

Visual changes should avoid unnecessary runtime JavaScript. CSS/layout changes are preferred where they can achieve the desired result without adding application complexity.

CUE ID/WebGL remains isolated and lazy-loaded. Failure or delayed loading of 3D must never block Artist Profile or booking workflows.

## Implementation sequence

1. shared app shell and tokens;
2. Bookings and Request Detail;
3. Calendar, preserving time-based functionality;
4. History and traceability;
5. Artist Profile;
6. humanoid CUE ID editor;
7. Guided Tour visual refresh;
8. final responsive/accessibility/performance pass across Dark/Light and ES/EN.

Each stage is validated in both themes and both languages before being considered complete.
