# CueBooker privacy and GDPR foundation

Status: product/engineering baseline. Legal review required before treating the public policies as final.

## Consent model

CueBooker uses category-based, versioned consent:

- `necessary`: always true; essential product/security/session functionality.
- `analytics`: optional and off until explicit consent.
- `marketing`: optional and off until explicit consent.
- `decidedAt`: ISO timestamp of the decision.
- `version`: consent-policy version. A version change can require a fresh decision.

The UI must provide comparable access to Accept all, Reject optional and Configure. Users can reopen preferences later and withdraw optional consent.

GTM/GA4 must not load while analytics consent is false. Product code owns analytics event semantics through `useAnalytics().track()`.

## GDPR launch checklist

Before public launch, complete and review:

1. Identity and contact details of the data controller.
2. Record of processing activities and data map.
3. Purpose and lawful basis for each processing activity.
4. Processor inventory and Data Processing Agreements.
5. International-transfer assessment and safeguards where applicable.
6. Data retention/deletion schedule by data category.
7. Data-subject rights workflow: access, rectification, erasure, restriction, objection, portability and consent withdrawal.
8. Account deletion and data export implementation.
9. Security and incident/breach response procedure.
10. Privacy by design review for new product features.
11. Separate marketing consent where direct marketing is introduced.
12. Cookie/technology inventory with provider, name, purpose and lifetime.
13. Consent evidence strategy appropriate to the final CMP/implementation.
14. Final legal review of Privacy Policy, Cookie Policy and Terms.

## Current technical scope

The current consent preference is stored client-side. This is suitable for the present pre-launch/basic analytics foundation, but the team must reassess whether server-side consent evidence is required once authenticated accounts, marketing, additional vendors or regulatory requirements expand.

Do not add a new analytics/marketing vendor without updating the inventory, policies, consent categories and technical gating first.
