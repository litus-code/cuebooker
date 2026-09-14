# Environments

Status: target operating model

Cuebooker must make it difficult to accidentally use production resources during development.

## Environment matrix

| Environment | Purpose | Application URL | Database/Auth | Data policy |
|---|---|---|---|---|
| local | developer feedback | localhost | local Supabase or dedicated dev project | synthetic only |
| preview | PR validation | provider-generated preview URL | development/test backend or isolated ephemeral strategy | synthetic only |
| staging | release/integration validation | staging.cuebooker.com | dedicated staging project | synthetic/anonymized only |
| production | real users | cuebooker.com / app.cuebooker.com | dedicated production project | real data |

`preview` and `staging` are not production aliases.

## Isolation rules

- Separate Supabase projects for staging and production.
- Production service-role/database credentials exist only in production secret stores.
- Staging email must be sandboxed/allow-listed until explicitly approved, so tests cannot email real promoters/artists.
- Storage buckets are separated by environment.
- Analytics/error monitoring carries an environment tag.
- Production data is never copied to local machines. If production-like datasets become necessary, use generated or properly anonymized fixtures.

## Configuration contract

Environment variables are documented in `.env.example` without secret values. Code reads configuration through a small validated configuration layer rather than arbitrary `process.env` access throughout the codebase.

Target variable groups:

```text
# application
NUXT_PUBLIC_APP_ENV
NUXT_PUBLIC_SITE_URL

# Supabase public/browser-safe
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY

# server only
SUPABASE_SERVICE_ROLE_KEY

# email server only
EMAIL_API_KEY
EMAIL_FROM

# observability
SENTRY_DSN / provider equivalents
```

Names are illustrative until implementation; once shipped they become part of the configuration contract.

## Local development

Preferred long-term setup is Supabase CLI locally so migrations/RLS can be tested without depending on a shared cloud dev database. Until backend implementation starts, local Nuxt remains:

```bash
pnpm install
pnpm dev
```

Before the first DB migration we will add reproducible local backend commands and seed data.

## Environment promotion

Code is promoted, not manually copied:

```text
feature branch -> PR preview + CI -> main -> staging validation -> production deployment
```

For a one-person team, staging may initially deploy automatically from `main` and production may require an explicit protected approval/tag. The exact release trigger is recorded in the deployment ADR.

## Secrets

`.env` files are local only and gitignored. `.env.example` contains names and safe examples only. Never paste production secrets into issues, PR descriptions, logs or documentation.