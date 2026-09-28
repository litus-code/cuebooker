# Cuebooker agent workflow

Updated: 17 September 2026
Status: ACTIVE

This document defines how an agent should process significant Cuebooker product/engineering work from request to validation and handoff.

It is derived from the user's preferred working method but is native to Cuebooker. It intentionally removes all Radisson/Tridion/SDL-specific process.

Read together with:

- `AGENTS.md`
- `docs/HANDOFF.md`
- `docs/AGENT_ARCHITECTURE.md`
- `docs/ARCHITECTURE_REFERENCE.md`
- `docs/ARCHITECTURE_DECISION_REGISTER.md`

## 1. Core working rules

1. The agent proposes; the user owns product decisions.
2. For significant work, separate discovery, impact, plan, execution, validation and handoff rather than improvising directly in code.
3. Do not reopen decisions already documented unless new evidence materially changes them.
4. Do not ask the user to repeat context that exists in repository docs.
5. Prefer the simplest implementation that satisfies Cuebooker architecture and product truth.
6. Never introduce fake product data to hide an empty state in the authenticated product.
7. Never call demo/local-browser state production truth.
8. Never weaken RLS or move secrets to the browser to make a feature easier.
9. Staging and production are separate safety boundaries.
10. Significant work is not finished until `docs/HANDOFF.md` reflects the actual state.

## 2. Git rule

Default behavior:

- do not create commits or push changes unless the user has explicitly asked the current agent to apply changes directly to the connected repository;
- if direct repository mutation is explicitly requested, that authorization applies only to the agreed scope;
- do not merge PRs or deploy production without explicit user intent;
- do not rewrite history or force-update refs unless explicitly agreed and justified.

When working locally, leave changes reviewable for the user. When using a connected repository tool, state exactly what was changed and which commit/revision resulted.

## 3. When to use the full workflow

Use the full workflow by default for:

- a new public/product surface;
- a new domain entity or important schema field;
- RLS/security changes;
- a new Edge Function or integration;
- a change spanning more than 2-3 files;
- a major refactor;
- changes to Booking Core semantics;
- changes to public/private data boundaries;
- deployment/migration work;
- product decisions that affect several later features.

Fast track is acceptable for:

- copy fixes;
- tiny visual fixes;
- isolated type corrections;
- a trivial one-file bug with no behavior/architecture change;
- documentation corrections that merely align with an already-decided truth.

Even on fast track, architecture/security rules still apply.

## 4. Phase 0 — Establish current truth

Before proposing implementation:

1. Read `AGENTS.md`.
2. Read `docs/HANDOFF.md`.
3. Check the actual branch/HEAD.
4. Read the product/architecture docs relevant to the task.
5. Inspect the real files/schema currently involved.
6. Distinguish what is already implemented from what docs merely propose.
7. Identify whether the task touches staging or production.

Do not rely on remembered filenames, migrations or screenshots when the repository can answer the question.

Output should be a short statement of current truth and the actual next problem.

## 5. Phase 1 — Product elicitation

Goal: make the feature unambiguous before architecture hardens around it.

For each material decision:

- restate the user goal in product terms;
- identify the user/persona and real-world workflow;
- distinguish must-have V1 behavior from future automation;
- offer alternatives only where a real trade-off exists;
- evaluate the option against Cuebooker's product principles and club-culture positioning;
- avoid feature proliferation when one normalized model can cover several entry paths.

For Cuebooker specifically, ask these questions internally:

- Does this create another Booking model or can it normalize into Booking Core?
- Does it require promoters to create an account unnecessarily?
- Does it expose private commercial data?
- Does it force DJs/managers to change how real bookings arrive?
- Is it solving operational truth or vanity metrics?
- Will an established artist/agency and an emerging DJ both understand the value?

Do not touch code while a core product semantic is still unresolved.

### Closing Phase 1

Record agreed product decisions in the relevant product document. If the conversation has already clearly authorized proceeding (for example “dale”, “adelante”, “proseguir”), do not repeatedly ask for ceremonial confirmation unless a new trade-off appears.

## 6. Phase 2 — Impact and architecture

Goal: determine exactly what the feature changes and what existing debt collides with it.

Produce:

### A. Affected surfaces

Group by responsibility:

```text
Domain / types
Application services
Composables/state
UI/pages/components
Database/migrations
RLS/security
Edge Functions/integrations
Tests
Docs
Deployment/config
```

### B. Contract collisions

For every changed contract, identify consumers:

- function/RPC signature;
- component props/events;
- domain type;
- database column/type;
- route shape;
- public API payload;
- environment variable;
- RLS assumption.

### C. Technical debt severity

Classify only debt that collides with the current work:

- **SHOWSTOPPER** — feature cannot be correct/safe without fixing it.
- **HIGH RISK** — likely regression, security/privacy issue or broken ownership boundary.
- **WARNING** — architecture debt but not immediately unsafe.
- **TRIVIAL** — cheap cleanup adjacent to the change.

Do not turn this phase into a repository-wide code review.

### D. Architecture quality gate

Before implementation answer:

- What entity owns the truth?
- Which workspace/artist owns it?
- Who can read/write it?
- Where is authorization enforced?
- Is anonymous/public access involved?
- What happens on retries/duplicates?
- What is synchronous vs asynchronous?
- What personal/private/commercial data is involved?
- How will it be indexed/read at scale?
- What gets logged?
- What external provider boundary exists?
- What is the rollback strategy?

If these answers are unclear, the feature is not architecture-ready.

## 7. Phase 3 — Execution plan

Build the plan in dependency order.

Typical Cuebooker sequence:

```text
1. Domain semantics / ADR if structural
2. Schema + constraints + indexes
3. RLS / privileged command boundary
4. Service / application API
5. UI / route integration
6. Tests
7. Staging validation
8. Security/performance advisors
9. Docs + handoff
10. Production gate (separate decision)
```

For public ingress specifically, secure database/server boundaries precede visual integration.

Each plan step should state:

- files/schemas affected;
- intended behavior;
- verification method;
- whether it is staging-only;
- any rollback implication.

## 8. Phase 4 — Execution

Rules while implementing:

- follow the agreed order;
- keep changes inside the planned scope;
- if a new material product decision appears, pause that subproblem and resolve it instead of inventing behavior;
- prefer atomic domain/database commands for multi-record invariants;
- do not bypass a failing authorization model from the client;
- do not silently add fields/flows “for future use”;
- preserve incomplete-data support in Booking Core;
- keep public and private surfaces explicitly separated.

Progress updates should describe meaningful completed outcomes, not every tool call.

## 9. Phase 5 — Validation

A feature is not complete because it compiles.

Validate the relevant layers.

### Application

- unit tests;
- typecheck when available;
- production/static generation build;
- lint if configured;
- no obvious dead/demo path remaining in the feature.

### Database

- migration replay/order considered;
- happy path;
- invalid input;
- duplicate/retry behavior;
- non-member/cross-workspace rejection;
- archive/read-only semantics if involved;
- rollback transaction validation where practical.

### Security

- no service-role or secret in browser;
- RLS still isolates tenants;
- public endpoint returns minimal data;
- abuse/input limits for anonymous endpoints;
- advisors checked after relevant DDL/RLS/function changes.

### UX

- desktop smoke;
- mobile smoke around 390 px;
- keyboard/focus/accessibility basics;
- empty/loading/error/success states;
- no fake demo fallback masking missing production data.

### Environment

Be exact about what was validated:

- PR preview is not automatically stable staging;
- staging is not production;
- a code commit is not proof a migration was applied;
- an Edge Function in the repository is not proof it was deployed.

## 10. Production gate

Production is always a separate gate for important backend/data changes.

Before production:

- repository migration chain is coherent;
- staging validation is complete;
- RLS/security checks pass;
- backup/rollback expectations are understood;
- production/staging credentials are independently verified;
- no test/demo values will be written to production;
- user explicitly intends the production action.

Never infer production permission from “dale” when the current discussion has been about staging/development only.

## 11. Phase 6 — Handoff

Every significant block ends by updating `docs/HANDOFF.md`.

The handoff must contain:

```text
Date
Branch
Exact HEAD/commit if repository changed
Current product milestone
What was implemented
What was validated
Environment(s) validated
Known caveats/debt
Files/migrations/functions introduced
What must NOT be changed casually
Exact next implementation block
Production status
```

Do not write aspirational handoff text as if it were implemented.

If a status document became stale during the work, update it or explicitly mark the living handoff as newer authority.

## 12. Documentation discipline

A future agent should be able to resume without chat memory.

Therefore:

- structural decision -> ADR register;
- enduring technical rule -> `AGENT_ARCHITECTURE.md` / `ARCHITECTURE_REFERENCE.md`;
- product model -> dedicated product document;
- actual implementation state -> implementation status document;
- current baton pass -> `HANDOFF.md`;
- agent operating process -> this document;
- entry/read order -> `AGENTS.md`.

Do not bury a critical decision only in a chat or PR comment.

## 13. Cuebooker product review lens

When reviewing a feature, evaluate it through all of these lenses rather than UI alone:

- booking operations expertise;
- DJ/manager/agency real workflow;
- club-culture credibility;
- accessibility;
- information architecture;
- privacy/security;
- mobile behavior;
- commercial usefulness;
- emotional clarity without manipulative dark patterns;
- brand authenticity rather than generic SaaS polish.

For later marketing/homepage work, product truth comes first. Copy and persuasion must emerge from real capabilities rather than promising integrations or automation that are not connected.

## 14. Current strategic order

Unless `docs/HANDOFF.md` says otherwise, the current strategic sequence is:

```text
Booking Core truth
-> public artist profile + public booking ingress
-> booking appears in real board
-> promoter acknowledgement/follow-up
-> embeddable widget/deep links/attribution
-> additional capture automation
-> product analytics/observability
-> launch hardening
-> homepage/marketing redesign around the proven product truth
-> later identity/network layers such as CUE ID
```

This order can change, but changes should be deliberate and documented.