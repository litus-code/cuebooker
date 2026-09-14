# Authentication

Status: target architecture

## Decision direction

Use Supabase Auth as the initial identity provider, with PostgreSQL as the application data store. Authentication proves identity; authorization remains an application/database responsibility.

## Principles

- Never store passwords in Cuebooker application tables.
- Never expose Supabase service-role credentials to browser code.
- Use provider-supported SSR/session handling for Nuxt rather than inventing a token storage scheme.
- Treat cookies/session tokens as credentials.
- Server-side protected operations validate the authenticated user on every request.
- Authentication metadata is not the canonical store for mutable business permissions.

## Initial login methods

Start small:

1. Email + password or magic link/passwordless email, selected during implementation based on UX and operational trade-offs.
2. Email verification before privileged/account-changing actions.
3. Password reset/account recovery if passwords are enabled.

Social login is deferred until there is evidence it materially improves activation.

## Registration flow

```text
visitor
  -> /join?ref=<source>
  -> create auth identity
  -> verify email when required
  -> create application profile transactionally/idempotently
  -> capture acquisition attribution
  -> choose onboarding path
  -> create/manage artist or organization membership
  -> enter private workspace
```

A failed onboarding step must be resumable. Registration must not leave unrecoverable half-created business records.

## Session model

- Prefer secure, HttpOnly cookie-based SSR-compatible sessions where supported by the integration.
- Production cookies use `Secure`, appropriate `SameSite`, scoped domain/path and finite lifetime.
- Rotate/refresh sessions through provider-supported mechanisms.
- Sign-out invalidates the local session and provider session as appropriate.
- Sensitive account changes should require recent authentication when supported/needed.

## Server validation

Do not trust a user object supplied by the client. Server endpoints derive identity from the validated session/JWT and use that identity for authorization.

## Account lifecycle

States to design explicitly:

```text
pending verification
active
suspended
scheduled for deletion
deleted/anonymized
```

Suspension is not deletion. GDPR erasure is not implemented as simply deleting the auth row without considering business/legal retention requirements.

## Service identities

Background jobs/integrations use dedicated server-side credentials and must be distinguishable in audit logs. Service-role access bypasses normal RLS and therefore must be limited to trusted server code, never general request handlers by default.

## Abuse controls

Before public launch, registration and recovery endpoints require rate limiting/provider protections, generic error responses where account enumeration is a risk, and monitoring for unusual authentication failures.

## Open implementation choices

The exact Nuxt/Supabase integration package and password-vs-magic-link default will be finalized in the implementation ADR/PR after a spike verifies SSR behavior, cookie handling and Cloudflare runtime compatibility.