# Authorization

Status: target architecture

## Model

Cuebooker uses a combination of:

- **RBAC** for coarse capabilities within a resource context.
- **Relationship/ownership checks** for which artist or organization the actor may access.
- **PostgreSQL Row Level Security (RLS)** as a database enforcement boundary for client-accessible data.
- **Server-side use-case authorization** for business actions and transitions.

A role name alone is never sufficient authorization.

## Resource contexts

### Artist membership

`owner`, `manager`, `editor`

Example capabilities:

| Capability | owner | manager | editor |
|---|---:|---:|---:|
| view private artist | yes | yes | yes |
| edit profile | yes | yes | yes |
| manage availability | yes | yes | configurable |
| manage bookings | yes | yes | no by default |
| manage members | yes | no by default | no |
| archive artist | yes | no | no |

### Organization membership

`owner`, `admin`, `member`

Capabilities depend on organization type and are resolved in application policy code, not scattered across Vue conditionals.

### Platform administration

Platform admin is not a self-selectable signup role. Elevated support access must be minimal, auditable and ideally time/reason bound as the platform matures.

## Authorization check shape

A protected action should answer:

```text
1. Is the caller authenticated?
2. Is the account active?
3. What resource is being accessed?
4. What relationship does the caller have to that resource?
5. Does that relationship grant the requested capability?
6. Is the requested state transition itself legal?
```

## RLS rules

RLS is enabled on user/business tables exposed through Supabase APIs. Policies default to deny.

Examples:

- Public can select only published discovery-safe artist data through a controlled view/API.
- Artist members can select their artist's private records.
- Only artist members with the relevant capability can update artist data.
- Organization members can access organization rows only for organizations they belong to.
- Booking access is granted to parties/memberships participating in that booking.

Do not create broad policies such as `authenticated users can select all artists` for private tables.

## API boundary

Frontend route guards improve UX but are not security controls. Every server endpoint and database operation remains safe if a user calls it manually.

## Permission evolution

Do not encode all permissions permanently in JWT custom claims. Claims can become stale and are awkward for fast-changing organization memberships. JWT identity may contain stable/coarse attributes, while current resource authorization is resolved from database relationships/policies.

## Testing

Authorization requires negative tests, not only happy paths. At minimum test:

- anonymous cannot access private resource
- unrelated authenticated user cannot access resource
- member with insufficient role cannot mutate resource
- valid member can perform permitted action
- revoked membership loses access
- public discovery never exposes private fields
- service role is never used from browser code