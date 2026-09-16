# Cuebooker Booking Core Product Vision

Updated: 16 September 2026
Status: ACTIVE PRODUCT PRIORITY
Branch context: `feature/app-visual-system`

## 1. Decision

Cuebooker is now prioritising the operational booking loop above CUE ID, Passport, 3D and other identity-expansion work.

The core loop is:

```text
CUE -> Booking -> Activity -> Next Move -> Calendar
```

This does NOT remove or invalidate Artist Profile, CUE ID, CUE SIGNAL, CUE PASSPORT or the wider identity vision. Those remain part of the product world, but they are temporarily secondary until the booking core becomes genuinely useful in day-to-day work.

The goal is not to build another generic CRM or another "booking manager" with more forms. The goal is to make Cuebooker the easiest place to preserve the context of a booking regardless of where the real conversation happened.

Internal principle:

> Cuebooker does not replace the channels artists already use. It prevents context from being lost between them.

## 2. Problem we are solving

Real bookings often do not happen end-to-end inside one platform. They can begin or progress through:

- phone calls;
- WhatsApp;
- Instagram / DMs;
- direct email;
- booking forms;
- meetings;
- conversations in clubs or festivals;
- managers or agents;
- manual outreach by the artist.

The product must not assume that every booking begins through Cuebooker's public form, nor that every negotiation should be forced into an in-app chat.

The current term "request" is too narrow if interpreted as something that always arrives from outside. The long-term domain concept is a `Booking` / booking opportunity that can originate from many channels.

## 3. The friction constraint

The biggest product risk is not a missing feature. It is effort.

If an artist finishes a call and then has to:

1. open Cuebooker;
2. find the correct section;
3. open a booking;
4. choose an interaction type;
5. fill many fields;
6. save;

then the system will not become habitual.

Primary UX target:

> From something happening in real life to being captured in Cuebooker in less than 10 seconds whenever possible.

Cuebooker should feel like "this just happened, remember it for me", not "administer a CRM record".

## 4. CUE: the universal capture action

The proposed interaction concept is `CUE`.

CUE is a fast action available from desktop and mobile. It is not intended to open a large form.

Initial concept:

```text
+CUE

What happened?
[ ... ]
```

The user can type a short natural-language note, for example:

> Hector from Nitsa called for 23 September. 1,200 EUR. Waiting to confirm schedule.

Cuebooker should eventually be able to infer or propose:

- contact;
- promoter / venue;
- date;
- fee / offer;
- source channel;
- status;
- next action.

The user confirms before creation.

### MVP discipline

Do not make natural-language extraction, voice or AI a prerequisite for the first implementation.

First prove that a very fast manual booking creation flow is useful. Then add richer capture modes.

Longer-term CUE input modes can include:

- Write;
- Speak;
- Paste;
- Share to Cuebooker from other apps where technically feasible.

## 5. Manual booking creation

Bookings must support records that originate without a public Cuebooker booking request.

A manual booking can start from:

- phone;
- WhatsApp;
- Instagram;
- email;
- in person;
- artist outreach;
- manager/agent;
- other.

The first version should ask for the minimum useful information only. Suggested fields:

- Contact / promoter;
- Venue or organisation;
- Event / context;
- Date or "date not set";
- Offer / fee optional;
- Origin channel;
- Status;
- Note;
- optional Next Move.

Do not require all metadata up front.

Existing public-form bookings and manual bookings must end up in the same Bookings surface.

## 6. One booking, one professional thread

The current Conversation concept should evolve into `Activity`.

Activity is the canonical history of the booking, not only a message thread.

Potential activity types:

- email sent;
- email received;
- call made;
- call received;
- WhatsApp interaction;
- Instagram/DM interaction;
- meeting / in-person conversation;
- private note;
- status change;
- hold created;
- hold released;
- calendar change;
- attachment/document event;
- system event.

Example:

```text
16 SEP 18:42 · CALL
Hector proposes 1,200 EUR. Schedule still pending.

16 SEP 19:05 · EMAIL SENT
Conditions recap sent.

17 SEP 10:14 · EMAIL RECEIVED
Schedule confirmed: 02:00-04:00.

17 SEP 10:20 · STATUS
Confirmed.
```

The goal is continuity of context, not forcing all communications to happen inside Cuebooker.

## 7. Fast external activity logging

When manual logging is required, it should be extremely fast.

Suggested quick actions inside a booking:

```text
Send email
Log call
Add note
Log WhatsApp
```

Do not overbuild channel-specific forms initially.

A short text note plus timestamp and channel can be enough for the first version.

## 8. Email direction

Email must preserve the artist/manager's identity while allowing Cuebooker to maintain the booking thread.

MVP direction:

- visible sender identity clearly names the artist/manager;
- Cuebooker can technically send the message;
- replies should eventually be correlated back to the booking using a unique reply address / thread identifier;
- the promoter must never be confused about who is contacting them.

Conceptual example:

```text
From: Litus via Cuebooker
Reply path: unique booking thread
Signature:
Litus
DJ · Barcelona
Booking managed with Cuebooker
```

A later phase may support connecting Gmail, Outlook or a custom professional domain so messages are sent through the artist's own mailbox while Cuebooker retains thread context.

Do not require connected email accounts for the first operational version.

## 9. Next Move

Each active booking should be able to have one clear `Next Move`.

Examples:

- Wait for promoter reply;
- Confirm fee;
- Confirm schedule;
- Send rider;
- Call tomorrow;
- Send contract;
- Check hold;
- Confirm travel.

The goal is to answer:

> What needs to happen next?

Overview should eventually derive its "Needs your attention" area from real Next Moves, pending replies and holds rather than decorative KPI cards.

Example:

```text
NEEDS YOUR ATTENTION

NITSA
Confirm schedule
Today

INPUT
Waiting for reply
2 days

RZZ
Send rider
Tomorrow
```

## 10. Hold as a first-class booking concept

`Hold` is important in professional booking workflows and should become a real product state/concept rather than a note hidden in a conversation.

A hold may include:

- booking;
- date/time;
- promoter/contact;
- expiry or follow-up date;
- calendar presence;
- current priority if later required.

Example:

```text
HOLD
Nitsa Club
23 SEP
Expires in 48 h
```

Creating a hold should connect automatically with Calendar.

A future reminder can surface when a hold needs follow-up.

## 11. Calendar relationship

Calendar remains a first-class operational surface.

Bookings should progressively drive calendar state:

- proposed dates;
- holds;
- confirmed dates;
- rejected/released dates;
- start/end time;
- overlap warnings;
- linked booking navigation.

Do not simplify Calendar to dates only. Existing time-based behaviour must be preserved.

## 12. Relationship Memory

A longer-term differentiator is professional relationship memory rather than a generic CRM contact card.

Cuebooker should remember the history between artist/manager and promoter/venue.

Potential view:

```text
HECTOR · NITSA

3 conversations
2 confirmed bookings
Last fee: 1,200 EUR
Last date: 23 Sep 2026
Barcelona

Worked together 2 times
[View history together]
```

This does not score or rank the promoter or artist. It documents real professional history.

This layer can later feed CUE PASSPORT and trajectory surfaces.

## 13. Product world and long-term connection

The wider Cuebooker world should emerge from real usage rather than artificial lore or empty gamification.

Desired progression:

```text
CUE
  ↓
Booking
  ↓
Activity
  ↓
Next Move / Hold
  ↓
Calendar
  ↓
History
  ↓
Relationship
  ↓
CUE PASSPORT
  ↓
CUE ID / Share / wider identity world
```

Important principle:

- Passport should not feel manually fabricated;
- cities can emerge from real bookings;
- venues can emerge from real history;
- promoter relationships can emerge from repeated work;
- trajectory should progressively document itself.

This is preferred over XP, streaks, leaderboards or vanity metrics.

## 14. Future visual concept: constellation / professional world

Do NOT build this now.

A future expressive layer could visualise the artist's accumulated world as a network of:

- artist;
- promoters;
- venues;
- cities;
- bookings;
- repeated relationships.

This is not intended as a social graph or popularity score. It is a visual representation of professional history and scene connections.

It may eventually become part of Passport/Share.

## 15. Competitive positioning

Cuebooker should not attempt to win by being:

- Gigwell with fewer features;
- Echobeat with a different visual design;
- another generic booking CRM;
- an in-app chat that asks promoters to abandon their normal communication habits.

Existing competitors validate that artists, agents and agencies need booking operations, calendars, contacts, contracts and centralisation.

Cuebooker's opportunity is to be especially natural for the fragmented reality of DJ bookings:

> Conversations can happen anywhere. Cuebooker keeps the booking coherent.

The strongest defensible value should become cumulative professional memory:

- who;
- where;
- when;
- what was offered;
- what was discussed;
- current state;
- what comes next;
- how previous work with that person/venue ended.

## 16. What we keep from the current product

Do NOT demolish the current application.

Keep and evolve:

- Overview;
- Bookings;
- filters/search/counts;
- Booking Detail;
- Conversation UI as the starting point for Activity;
- Calendar;
- 24-hour day view;
- History;
- status system;
- guided tour;
- Artist Profile;
- responsive shell;
- Dark/Light;
- ES/EN;
- current design system.

The strategy is evolutionary, not destructive.

## 17. Current domain reality

The existing booking domain already contains:

```ts
source: 'booking_link' | 'manual'
```

This is useful groundwork, although current creation still defaults to `booking_link`.

Use this as a migration path rather than introducing a second parallel booking model.

The current `messages[]` structure can serve as migration input for a future Activity model. Do not discard historical message data.

## 18. Implementation order

### Block A · CUE / manual booking

Goal: create a booking manually in seconds and see it in the existing booking list/detail.

Requirements:

- visible `+ CUE` / `New booking` entry point;
- channel/source selection;
- minimal input;
- mobile-first interaction;
- same booking list as public-form bookings;
- no regression to filters/detail/statuses;
- current data can remain prototype/local while interaction is validated.

### Block B · Activity

Goal: one coherent booking history.

- migrate/extend conversation model;
- email messages remain supported;
- add call / note / WhatsApp / system activity types;
- chronological timeline;
- preserve traceability.

### Block C · Next Move + Hold

Goal: Cuebooker understands what needs attention.

- single Next Move per active booking initially;
- hold representation;
- optional due/follow-up time;
- calendar linkage;
- attention state.

### Block D · Overview operational attention

Goal: Overview becomes useful daily.

- Next Moves;
- expiring holds;
- stale waiting states;
- replies that need action;
- avoid vanity KPIs as primary content.

## 19. Deferred until this loop is strong

Temporarily do not prioritise:

- production CUE ID 3D implementation;
- Passport expansion;
- constellation visualisation;
- deep social/share mechanics;
- complex AI assistant;
- deep Gmail/Outlook integrations;
- automatic WhatsApp ingestion;
- broad CRM features;
- contracts/invoices simply because competitors have them.

These can return once the operational loop is validated.

## 20. Product test for every decision

Before adding a field, action or screen ask:

1. Does this help capture what happened?
2. Does this preserve booking context?
3. Does this make the next action clearer?
4. Does this reduce the chance of losing a booking or forgetting a follow-up?
5. Can a DJ/manager use it quickly from a phone?
6. Are we making the user work for Cuebooker, or is Cuebooker working for the user?

If the answer to the last question is "the user is doing admin for the app", simplify.

## 21. Immediate product priority

The next product-development focus is 100%:

```text
CUE -> Booking -> Activity -> Next Move -> Calendar
```

Start with Block A. Preserve the existing visual system and current working capabilities. Refactor deliberately when necessary, but do not stack arbitrary fixes or recreate working areas from scratch.
