# Cuebooker architecture rules for agents

Updated: 17 September 2026
Status: ACTIVE

This is the operational architecture guide for agents working on Cuebooker. It is intentionally Cuebooker-specific. It replaces any architecture guidance inherited from unrelated projects such as Radisson/Tridion/SDL.

When this document conflicts with `docs/ARCHITECTURE_REFERENCE.md` or an accepted decision in `docs/ARCHITECTURE_DECISION_REGISTER.md`, the reference architecture and ADR register win. Update the documents together when a structural decision changes.

## 1. Product architecture in one sentence

Cuebooker is a multi-tenant booking workspace for DJs, managers and agencies. Multiple ingress channels normalize into one Booking Core so the commercial truth is not fragmented by where a conversation started.

Canonical operational loop:

```text
Ingress / CUE
  -> Contact + Counterparty
  -> Booking
  -> Activity
  -> Next Move
  -> Hold
  -> Calendar projection
  -> History
```

CUE ID / Passport and other identity layers are downstream of this operational truth.

## 2. Current stack

- Nuxt 4
- Vue 3
- TypeScript
- Supabase Auth
- PostgreSQL / Supabase as system of record
- Supabase Storage
- Supabase Edge Functions for privileged/webhook operations where appropriate
- Cloudflare Pages for web delivery
- GitHub Actions for CI, preview, staging and production workflows

Do not introduce another frontend framework, a second primary backend language, microservices, Kafka, a dedicated search engine or a vector database without measured need and an ADR.

## 3. Root principle: architecture by necessity

Architecture defines where a responsibility belongs when it exists. It does not require every feature to create every layer.

Always choose the smallest structure that preserves the product boundaries.

Before creating a new layer, ask:

- Domain type/rule: is there a real invariant or reusable business rule?
- Service/repository boundary: is there mapping, orchestration, authorization or provider translation to own?
- Composable/store: is there reactive feature state or coordination that survives one local UI interaction?
- Component: is the responsibility reusable or large enough to deserve a boundary?
- Edge Function: does the operation need secrets, service-role access, webhook trust, public anonymous ingress or privileged orchestration?
- Database function: does the invariant need atomic transactional enforcement close to the data?

If the answer is no, do not manufacture a layer.

## 4. Dependency direction

The current repository is not being rewritten into a theoretical folder structure. New work follows these responsibilities:

```text
pages / components
      |
      v
composables / application coordination
      |
      v
services / adapters
      |
      v
Supabase API / Edge Functions / database commands

app/domain/ contains pure shared domain types and rules used by the layers above.
```

Rules:

- `app/domain/` must remain free of Vue, Nuxt, HTTP and Supabase client concerns.
- UI must not become the permanent home of database invariants.
- Components should consume application commands rather than hand-crafting privileged PostgREST mutations.
- Provider-specific logic belongs behind an adapter or Edge Function, not in Booking domain types.
- Slow/unreliable external work should not block the core database transaction unnecessarily.

Do not perform large folder refactors merely to match this diagram. Existing code is migrated opportunistically when the feature touches it and the refactor has product or safety value.

## 5. Booking Core invariants

These are non-negotiable unless an ADR changes them:

1. `Booking` is the central commercial opportunity entity regardless of ingress channel.
2. `Activity` is separate and append-oriented; do not embed conversation history back into Booking.
3. `Next Move` is future required action, not past history.
4. `Hold` is first-class and not merely a Booking status.
5. Calendar is a projection. Booking/Hold/private availability own their own truth.
6. Incomplete bookings are valid. Do not require fake data to create an opportunity.
7. Archive is non-destructive and preserves operational history.
8. Conflicts are diagnostics by default, not automatic blockers.
9. Relationship Memory is derived from real bookings/activities/relationships before introducing synthetic scores.
10. CUE is an input surface; interpreted text/voice is never authoritative data until validated through normal domain commands.

## 6. Ingress normalization

All ways of receiving an opportunity converge into the same Booking Core.

Keep these concepts separate:

- `origin_channel`: where the opportunity/conversation actually originated.
- `capture_method`: how the opportunity entered Cuebooker.
- entry attribution: where a user clicked a public Cuebooker booking/profile link, when known.

Examples:

```text
WhatsApp conversation + manual CUE
origin_channel = whatsapp
capture_method = manual

Public form opened from Instagram bio
origin_channel = booking_form
capture_method = public_form
entry attribution = instagram

Inbound email imported automatically
origin_channel = email
capture_method = email_import
```

Entry attribution is an attribution hint, not guaranteed truth. Never overload `origin_channel` with marketing/referral information.

## 7. Public artist surface

The artist's canonical public surface is the Artist Profile, not a separate cold booking form.

Desired product URL:

```text
https://cuebooker.com/<artist-slug>
```

The same public page is what the authenticated workspace calls “Vista previa de mi perfil”. Preview and published profile must not evolve as separate products.

The profile contains the booking capability. Deep links may open/focus it, for example:

```text
/<artist-slug>?booking=1&src=instagram
```

A web widget is an alternative presentation of the same public intake capability, not a different Booking model or inbox.

System routes must be reserved so artist slugs cannot collide with application routes (`workspace`, `access`, `onboarding`, `app`, `request`, `api`, `cue-id`, etc.).

The current static Nuxt/Cloudflare delivery model must be considered when implementing arbitrary public slugs. Do not assume dynamic routes work in production without a prerender/runtime strategy.

## 8. Public/private data boundary

The public artist surface may expose intentionally published professional identity such as:

- stage name;
- public imagery;
- bio;
- city/country when published;
- genres/styles;
- performance formats;
- public social/music links;
- explicitly public booking/contact entry points.

Do not expose by default:

- fee minimum/typical/internal commercial conditions;
- private contacts;
- negotiation history;
- workspace notes;
- private calendar blocks;
- private availability detail;
- internal status/Next Move/Holds;
- private documents/contracts/riders unless explicitly published by product design.

## 9. Multi-tenancy and authorization

`workspace` is the tenant boundary.

- Solo artist: one workspace may manage one artist.
- Agency: one workspace may manage multiple artists.
- `workspace_artists` determines which artists belong to a workspace.
- UI artist selection scopes work; authorization remains workspace-based unless an explicit finer-grained model is introduced.

Every private tenant record must have an unambiguous workspace boundary.

RLS baseline:

- RLS enabled on every exposed private table.
- Deny by default.
- Membership predicates enforce tenant access; never trust a caller-supplied workspace UUID by itself.
- Browser UI hiding is usability, never authorization.
- `service_role` and other secrets never reach the client bundle.
- `SECURITY DEFINER` is not a generic permission fix. Use it only for a narrowly designed command with explicit exposure/grants and a reviewed trust boundary.

## 10. Anonymous public intake boundary

A promoter may submit the first booking request without a Cuebooker account.

Therefore public booking intake must not call private Booking tables directly from the browser. It requires a server/edge trust boundary that:

- resolves a public artist slug to the correct managed artist/workspace without trusting an arbitrary workspace id from the client;
- validates a strict public schema and field lengths;
- normalizes and sanitizes input;
- implements idempotency/duplicate protection;
- applies rate limiting and abuse/bot controls appropriate to traffic;
- performs Contact/Counterparty/Booking/Activity creation atomically or through one reliable command boundary;
- sets `origin_channel = booking_form` and `capture_method = public_form`;
- stores entry attribution separately when present;
- never exposes privileged credentials;
- never exposes private workspace data in its response.

Current Booking Core records require authenticated `created_by` values. Anonymous intake must not impersonate the workspace owner merely to satisfy that schema. The implementation must introduce an explicit system/anonymous creation model before public intake is considered production-ready.

## 11. State and composables

- Local interaction state stays local to the component when possible.
- Reusable feature state/commands belong in a composable/application boundary.
- Global application state uses a typed encapsulated Nuxt state/composable; avoid ad-hoc global mutable module state.
- Do not create a store only because a component contains `ref()`.
- Pure transforms/validators belong outside reactive composables.
- Never keep user-specific reactive state at module scope where SSR/runtime reuse could leak it across requests.

## 12. Components

Prefer components with clear input/output boundaries.

- UI components must not own service-role or privileged HTTP logic.
- Avoid duplicating domain rules across templates.
- Complex operational components may coordinate application composables, but database semantics belong below them.
- Mobile is a first-class product surface; no page-level horizontal overflow.
- Reuse Cuebooker's own visual tokens/classes/patterns. Do not import styling conventions from Radisson or unrelated design systems.

Cuebooker's current visual direction is dark/editorial/operational with restrained accent and compact metadata. Visual changes must preserve accessibility and readable density rather than adding decoration for its own sake.

## 13. Database changes

- Repository-controlled versioned migrations only.
- Staging before production.
- Cross-tenant integrity enforced with keys/constraints where useful, not only application code.
- Index for actual filter/order/join paths.
- Money is integer minor units or disciplined decimal; never authoritative JS binary float.
- Timestamps use authoritative timezone-aware instants where appropriate, plus event timezone semantics when local event time matters.
- Do not invent event times for date-only data.
- Database commands that change important state should append Activity where the product needs an audit trail.

After DDL/RLS/function work:

1. validate the scenario on staging;
2. run security advisors;
3. inspect performance advisors without blindly deleting fresh unused indexes;
4. verify tenant isolation and negative cases;
5. record the result in `docs/HANDOFF.md`.

Never apply Booking Core migrations to production merely because staging succeeded.

## 14. Edge Functions and integrations

Use server/edge operations when the feature needs secrets or privileged access. Examples:

- public anonymous booking intake;
- inbound email webhook processing;
- outbound provider calls requiring secret keys;
- future messaging/calendar webhooks.

Integration rules:

- verify webhook signatures/secrets;
- require provider event ids when available;
- idempotent processing;
- bounded payload sizes;
- provider adapters do not leak into core entities;
- log operational identifiers, never secrets;
- return minimal public data.

## 15. AI

AI is an assistant to deterministic product operations.

- Structured output validated against a schema.
- The model never writes commercial truth directly.
- Consequential fields such as date, fee, recipient and destructive changes receive deterministic validation and appropriate confirmation.
- AI unavailability must not break the deterministic booking product.
- Keep provider behind an adapter.
- Minimize private context sent externally.

## 16. Testing and validation

Test at the layer that owns the rule.

- Pure domain rules: fast unit tests.
- Services/adapters: transport and mapping tests.
- Database commands: transactional positive + negative validation on staging/local database.
- RLS: member/non-member/cross-workspace tests.
- Components: behavior/render tests for meaningful interaction paths.
- Critical vertical slices: manual desktop + mobile smoke in the correct environment.

Before calling a significant block finished, verify at minimum the relevant subset of:

```text
npm ci
npm test
npm run typecheck
npm run generate
npm audit --omit=dev --audit-level=high
```

If the repository does not expose one of these scripts, report that fact rather than inventing success.

## 17. Migration of existing code

Do not stop product work to rewrite the entire repository.

When a feature touches old code:

- fix blocking/safety architectural problems first;
- perform cheap local cleanup when it reduces future ambiguity;
- split large refactors when they obscure the actual feature;
- do not leave newly written code knowingly violating these rules.

## 18. Documentation hierarchy

For any significant Cuebooker task, read in this order:

1. `AGENTS.md`
2. `docs/HANDOFF.md`
3. `docs/AGENT_WORKFLOW.md`
4. this document
5. the product-specific document for the feature
6. `docs/ARCHITECTURE_REFERENCE.md`
7. `docs/ARCHITECTURE_DECISION_REGISTER.md`
8. implementation status docs relevant to the area

A chat transcript is never the canonical project memory. Repository documentation is.