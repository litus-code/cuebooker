# Cuebooker Architecture Decision Register

Updated: 17 September 2026
Status: ACTIVE
Companion document: `docs/ARCHITECTURE_REFERENCE.md`

This register records architecture choices that should not be casually reversed. A decision can be revisited when the documented trigger is met or new evidence invalidates its assumptions.

| ID | Decision | Status | Reason | Revisit when |
|---|---|---|---|---|
| ADR-001 | Keep Nuxt 4 + Vue 3 | Accepted | Existing implementation is substantial, framework fits public + app surfaces, migration has no current business value | Framework blocks required capability or measured performance despite architectural fixes |
| ADR-002 | TypeScript is the primary application language | Accepted | Shared types, lower operational complexity, adequate for UI/server/edge/AI orchestration | A bounded workload has clear runtime/ecosystem reasons for another language |
| ADR-003 | Do not use Python as the main backend | Accepted | Initial AI is orchestration, not ML research; a second backend language would add deployment and domain duplication | Custom ML/audio/data workload materially benefits from Python; implement as bounded worker/service |
| ADR-004 | PostgreSQL/Supabase is the system of record | Accepted | Relational model, transactions, RLS, indexing, JSONB, migrations, mature scale path | Proven workload cannot be served acceptably after query/index/scale work |
| ADR-005 | Browser IndexedDB is non-authoritative | Accepted | Suitable for demo/cache/offline, not shared production truth | Never as primary production store; may expand only as an offline cache/sync layer |
| ADR-006 | Workspace is the tenant boundary | Accepted | Supports solo artists and agencies without separate products/models | Only revisit if future legal/data-residency requirements demand stronger physical isolation |
| ADR-007 | RLS enabled for every private tenant table | Accepted | Database-enforced isolation protects against client/UI mistakes | Do not weaken; augment with API/service authorization where needed |
| ADR-008 | Booking is the central opportunity entity | Accepted | Normalizes bookings regardless of origin channel | Domain research shows multiple fundamentally different opportunity types require separate bounded contexts |
| ADR-009 | Activity is separate from Booking | Accepted | Scalable multi-channel history and audit, avoids embedded message arrays | Never fold history back into Booking; storage implementation may evolve |
| ADR-010 | Next Move is separate from Activity | Accepted | Distinguishes past fact from future required action | Workflow becomes complex enough to justify a broader workflow engine |
| ADR-011 | Hold is a separate entity, not only a Booking status | Accepted | A negotiation may hold one/multiple dates independently of commercial state | Real booking practice disproves the model or requires richer option/contract entity |
| ADR-012 | Calendar is a projection | Accepted | Booking/Hold remain truth; calendar also contains private availability/travel/etc. | Only implementation mechanism may change; ownership should remain outside Calendar |
| ADR-013 | CUE is an input surface, not persisted domain truth | Accepted | Text/voice/share/email can all produce the same domain commands | Never persist AI interpretation as authoritative without validated domain records |
| ADR-014 | AI outputs structured proposals validated by schemas | Accepted | Prevents model output from directly mutating commercial data | Do not weaken; confidence/automation thresholds may evolve |
| ADR-015 | Human confirmation for consequential AI actions by default | Accepted | Date, fee, recipient and destructive mistakes have real consequences | Mature evaluation proves a narrow action is safe enough for configurable automation |
| ADR-016 | AI provider behind adapter | Accepted | Prevents vendor lock-in in domain/application code | Provider selection can change without changing this boundary |
| ADR-017 | Start async work with Postgres outbox/jobs | Accepted | Lowest operational complexity for early volume | Throughput/retries/backpressure/scheduling justify managed queue |
| ADR-018 | No Kafka/event-streaming at startup | Accepted | Complexity is unjustified at current scale | High sustained event volume/multiple independent consumers create a measured need |
| ADR-019 | No dedicated search engine at startup | Accepted | Postgres indexes/full text/trigram sufficient initially | Search features/latency/volume exceed measured Postgres capability |
| ADR-020 | No dedicated vector database at startup | Accepted | AI does not imply vector search; pgvector can be evaluated first | Semantic retrieval becomes a validated product need and Postgres is insufficient |
| ADR-021 | Cloudflare remains web delivery platform for now | Accepted | Existing deployment and CDN are working | Operational cost/runtime limitations/deployment needs make another platform materially better |
| ADR-022 | Privileged/webhook logic is server/edge-side | Accepted | Secrets and trust boundaries cannot live in static browser code | Never move secrets to client; runtime/provider may change |
| ADR-023 | Separate private and public storage | Accepted | Booking docs/contacts have different privacy requirements from artist media | Do not weaken; storage provider may change behind adapter |
| ADR-024 | Money uses minor units or disciplined decimal, never JS float | Accepted | Commercial accuracy | Never use binary float for authoritative money |
| ADR-025 | Times are stored as authoritative instants + event timezone semantics | Accepted | Touring crosses timezones; browser locale is not authority | Schema may evolve, principle remains |
| ADR-026 | Migrations are repository-controlled | Accepted | Reproducible schema and safe environments | Never rely on undocumented production console edits |
| ADR-027 | Staging and production are isolated environments | Accepted | Reduces destructive/security risk | Never intentionally collapse them for convenience |
| ADR-028 | External integrations use adapters + idempotent webhooks | Accepted | Providers change and retry events | Adapter implementations can change, boundary remains |
| ADR-029 | Relationship Memory is derived initially | Accepted | Avoids duplicated truth and artificial scoring | Query cost justifies materialized projection/cache |
| ADR-030 | CUE ID/Passport are downstream of operational truth | Accepted | Identity should emerge from real trajectory, not synthetic gamification | Product strategy explicitly changes after validation |
| ADR-031 | All booking ingress converges into the same Booking Core | Accepted | Widget, public form, manual CUE, email and future adapters describe how an opportunity arrived, not different commercial entities | Domain evidence proves an ingress type needs fundamentally different lifecycle/invariants |
| ADR-032 | The canonical public artist surface is `/<artist-slug>` and contains the booking capability | Accepted | Gives artists a useful professional public presence and keeps booking in artist context instead of a cold standalone form | Routing/SEO/product research demonstrates a dedicated booking URL should replace the artist profile as canonical surface |
| ADR-033 | Authenticated “profile preview” previews the real public Artist Profile contract/layout | Accepted | Prevents two profile products from drifting and makes editing predictable | Draft/publishing requirements demand a distinct rendering system; even then public contract should remain shared |
| ADR-034 | Keep booking origin, capture method and public entry attribution separate | Accepted | Operational provenance and marketing referral are different facts; separation supports future adapters and analytics without corrupting source semantics | Evidence shows the concepts cannot be reliably separated in real workflows |
| ADR-035 | Anonymous public booking intake enters through a narrow server/edge boundary, never direct private-table browser writes | Accepted | Public callers are untrusted and unauthenticated; artist/workspace resolution, validation, idempotency and privileged writes require a protected trust boundary | Runtime provider may change; the trust-boundary principle does not |
| ADR-036 | Anonymous intake must not impersonate an authenticated workspace user | Accepted | Current `created_by` constraints are incompatible with truthful anonymous provenance; attribution must distinguish internal/system creation from the promoter Contact | A future identity model gives every submitter a verified authenticated identity without adding promoter friction |
| ADR-037 | Hosted public form and embedded widget share the same intake contract and Booking model | Accepted | Avoids duplicate backends/inboxes and guarantees consistent Contact/Booking/Activity semantics | Embedding requirements prove a separate bounded context is necessary |
| ADR-038 | `docs/HANDOFF.md` is the living cross-agent baton pass | Accepted | Project continuity must survive chat/model memory loss; implementation truth belongs in the repository | A stronger automated source-of-truth mechanism replaces it and is documented |
| ADR-039 | Automate derived operational work, keep commercial decisions human | Accepted | Cuebooker should remove repetitive follow-up/admin work without silently deciding whether an artist accepts, rejects, cancels, sends a commercial message or commits a consequential booking choice | Revisit only for narrowly scoped opt-in automation backed by measured safety and explicit user control |

## Decision process

When changing an accepted decision:

1. State the current constraint/problem.
2. Provide evidence or measured impact.
3. List considered options.
4. Describe migration and rollback.
5. Describe security/privacy/operational impact.
6. Update this register and `ARCHITECTURE_REFERENCE.md` before implementation when the change is structural.

## Architecture quality gate for new features

Before adding a significant capability, answer:

- What domain entity owns the truth?
- What workspace/tenant does the data belong to?
- Who may read/write it and where is that enforced?
- Is it synchronous or asynchronous?
- What happens on retry/duplicate/failure?
- Does it contain personal/private/commercial data?
- What is the retention policy?
- How is it paginated/indexed at scale?
- What gets logged, and what must never be logged?
- Does an external provider need an adapter?
- Can the feature work if AI/provider is unavailable?
- What is the rollback/migration strategy?

If these answers are unclear, the feature is not architecture-ready.