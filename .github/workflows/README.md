# Deployment workflows

- `ci.yml` validates pull requests and pushes to `main`.
- `deploy-staging.yml` deploys the exact `main` revision only after the `CI` workflow succeeds. It can also be run manually.
- `deploy-production.yml` is manual only and requires a commit SHA that is contained in `main`.

Cloudflare credentials are read from repository or environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Cloudflare Pages projects:

- `cuebooker-staging`
- `cuebooker-production`
