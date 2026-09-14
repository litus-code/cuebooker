# System Context

Status: target architecture

## Product boundary

Cuebooker connects discovery, booking and booking management for electronic-music artists, agencies and promoters. The platform owns the workflow and its state. Third-party email, storage, analytics or authentication infrastructure are implementation dependencies, not the source of truth for booking state.

## Actors

- **Artist / DJ**: manages one or more artist identities, profile, visibility, availability and booking activity.
- **Agency member**: manages an agency workspace and artists assigned to it.
- **Promoter / venue member**: discovers artists and creates/manages booking requests.
- **Platform administrator**: performs operational support with tightly controlled elevated access.
- **Anonymous visitor**: browses public/discovery content allowed for unauthenticated access.

A person can hold more than one role through memberships. Do not model a human account as permanently equal to one role.

## Bounded domains

### Identity
Authentication identity, user profile, sessions and account lifecycle.

### Organizations
Agencies, promoter/venue organizations, memberships, roles and ownership relationships.

### Artists
Artist identity, professional profile, links, genres, media and management relationships.

### Availability
Availability windows, calendar blocks and eventually calendar integrations.

### Booking
Requests, offers/counteroffers, messages, state transitions, confirmation and history.

### Discovery
Searchable/public representation of artists who explicitly opt in and the information they choose to expose.

### Acquisition
Referral sources, campaigns and attribution from academy/collective links through activation.

### Platform
Audit log, notifications, operational metadata and administrative tooling.

## Application layering

```text
UI / pages / components
        |
        v
Application use cases
        |
        v
Domain rules
        |
        v
Repository interfaces
        |
        v
Infrastructure adapters
        |
        +--> PostgreSQL
        +--> Auth
        +--> Storage
        +--> Email
```

Vue components must not become the authoritative place for booking transitions, authorization or persistence rules.

## Deployment boundary

Initially Cuebooker remains a modular monolith. Public website, private application and API may be deployed together. Logical separation is required before physical separation.

Target URL model:

```text
https://cuebooker.com       public product/discovery entry point
https://app.cuebooker.com   authenticated workspace (target, may initially live under /app)
https://staging.cuebooker.com non-production validation
```

The final choice between `/app` and `app.` is operational, not a reason to split repositories now.

## Data authority

- PostgreSQL is the source of truth for business data.
- Auth provider is the source of truth for credentials/session identity.
- Object storage is the source of truth for uploaded binary assets.
- Search indexes, analytics and caches are derived data and must be rebuildable.
- Browser IndexedDB/localStorage may be used for disposable UX state only after production persistence exists; it must not be authoritative for bookings.

## Integration rule

External integrations communicate through adapters. Domain code must not depend directly on provider-specific SDK objects. This keeps providers replaceable and makes testing possible.