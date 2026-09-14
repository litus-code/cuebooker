# Cuebooker Architecture Handbook

Status: living document
Last reviewed: 2026-09-14

This directory is the technical source of truth for Cuebooker's platform architecture. It describes the target architecture, the constraints that protect production, and the rules that new features must follow.

## Current state vs target state

Cuebooker is currently a product prototype. Some screens use browser-local persistence and the server API is not yet the production backend. Documents in this folder intentionally describe both **current** and **target** state so that planned architecture is never mistaken for already-shipped infrastructure.

A target decision becomes an implementation commitment only after its ADR is accepted and the corresponding code/infrastructure change is merged.

## Architecture principles

1. **Secure by default.** Deny access unless explicitly granted. Authorization is enforced server-side and in the database, never only in the UI.
2. **Production is reproducible.** Schema, migrations, configuration contracts, deployment workflows and infrastructure decisions live in version control.
3. **No manual production schema changes.** Database changes move through migrations and environments.
4. **Environment isolation.** Production data, credentials and storage are never reused in preview, staging or local environments.
5. **Domain logic stays out of UI components.** UI calls use cases/services; repositories isolate persistence details.
6. **Users are identities, not business entities.** A user may manage multiple artists and belong to multiple organizations.
7. **Least privilege.** Browser clients receive only public/scoped credentials. Administrative/service credentials are server-only.
8. **Observable systems.** Errors, important state changes and operational events are traceable without logging secrets or unnecessary personal data.
9. **Reversible delivery.** Deployments, migrations and feature releases are designed so a bad release can be contained or rolled back safely.
10. **Scale through clear boundaries, not premature microservices.** Start as a well-structured modular application and split services only when real operational or organizational pressure justifies it.

## Documents

- [System context](./system-context.md)
- [Data model](./data-model.md)
- [Authentication](./authentication.md)
- [Authorization](./authorization.md)
- [Environments](./environments.md)
- [Deployment](./deployment.md)
- [Observability](./observability.md)
- [Security](./security.md)
- [Architecture Decision Records](../adr/README.md)

## Change policy

Architecture changes that affect data ownership, authentication, authorization, hosting, tenancy, deployment or another foundational concern require an ADR. Implementation PRs should link the relevant ADR and update these documents if behavior changes.

## Initial platform shape

```text
Browser
  |
  v
Cloudflare DNS / CDN / WAF
  |
  v
Nuxt 4 application
  |-- public website
  |-- authenticated application
  |-- server API / BFF
  |
  +--> Supabase Auth
  +--> PostgreSQL + RLS
  +--> object storage
  +--> email provider
  +--> observability
```

The first implementation milestone is not feature breadth. It is a trustworthy vertical slice: registration -> authenticated session -> artist/profile ownership -> private area -> persisted data -> authorization -> auditability.