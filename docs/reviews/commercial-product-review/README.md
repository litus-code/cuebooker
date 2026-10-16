# Product-led public review — 16 October 2026

Application `a79cdb5d125bece2c02c950f0504c54b38af2974`, branch `integration/beta-home21-review`, draft PR114. Same Beta0.0.12 review candidate, no main/production/Supabase promotion.

## Result

- Home retains hero/problem/interactive journey/operational benefits. Profile + basic Passport are concise, with a campaign-preserving DJ link; CUE ID remains an in-development secondary mention.
- DJ order: hero, actual public-profile presentation (introduction/sound/links capture selector), shared-link distribution + short form preview, operational journey and conversation/calendar proof, approved-mailbox email capture, basic Passport trajectory, secondary CUE ID and signup close.
- Agency retains headline and initial roster demonstration. Actual roster/conversation/calendar captures demonstrate choosing an artist and keeping their context. Simpler agency-enquiry copy and conditional public-catalogue beta note; distribution remains lower.
- Initial access conditions next to principal signup CTAs. Basic Passport copy unified with current product; mailbox approval/limited beta activation and attachment scope explicit, no invented price/card/setup promise.
- One preview notice for the short demo form; name/email/proposal initially, extra details folded. Opt-in prop preserves normal/live form defaults. Email example warning appears once instead of per-card duplicates.
- Shared campaign helper closes attribution gaps in Home→landing/signup and public menus/cross-audience links. Existing events retained, no duplicate conversion event or booking-content payload added.
- Actual public-profile capture exposed dark text on permanently dark editorial sections in light mode. Scoped public-profile ink and button text corrected without changing profile data/intake behaviour; captures regenerated from the corrected UI.

## Verification

- `npm test`: **589 pass**,0 fail/skipped. Five new regressions: consent/tag/CTA uniqueness, both campaign destinations, cross-page query filtering and opt-in preview collapse preserving defaults.
- `npm run build`: passed,44 prerendered routes; whitespace clean. No typecheck/lint scripts are provided by this repository.
- Compiled Chromium: **48** Home/DJ/Agency × ES/EN × light/dark ×390/768/1024/1440 combinations. No page overflow/errors; section ordering, compact preview expansion/disabled fields, actual imagery, gallery controls/keyboard, campaign hrefs, mobile menu and down/up header behaviour pass.
- Full-page Axe WCAG2/2.1 A/AA at390/1440 for all routes/locales/themes: **24 checks, zero violations**. This is automated Chromium evidence, not a Safari or full manual accessibility certification.
- Isolated compiled funnel: DJ via Home and Agency directly, each with consent granted/denied. Simulated signup response only, no real account/email: origin/UTM/ref retained, exactly one click/start/completed signal when consented, none when denied, one mocked GTM script, no form email/password in dataLayer. Real GTM/GA report/container configuration is not verified or changed.
- Twenty screenshot assets are actual workspace/public-profile renderings with artificial fixture data, ES/EN and both themes. `capture.cjs` was executed against the local static build, blocks nonlocal/nonfixture network destinations and writes only local captures. No real hosted publication, tenant data or provider write.
- Protected diff against the previous candidate is empty for Supabase, services, Booking Core, workspace, auth/access and workflows. Native public profile changed only CSS; real form semantics/validation unchanged.

## Length review

Initial ES/dark state, same1000px viewport height; pixels are a comparison, not a fixed page-size contract. Home is shorter (~13.5% mobile /11.5% desktop). DJ and Agency intentionally gain product detail/evidence; galleries show one proof image at a time instead of stacking every capture. Screenshots have full-size links for mobile readability.

| Page | Width | Before | After | Difference |
| --- | --- | --- | --- | --- |
| `/` | 390 | 9297 | 8044 | -1253 |
| `/` | 1440 | 7569 | 6701 | -868 |
| `/dj/` | 390 | 7325 | 9174 | +1849 |
| `/dj/` | 1440 | 5618 | 8119 | +2501 |
| `/agency/` | 390 | 7963 | 8904 | +941 |
| `/agency/` | 1440 | 6657 | 7550 | +893 |

## Visual review

| Page/theme | Desktop1440 | Mobile390 |
| --- | --- | --- |
| home/light | [Capture](product-led-home-light-1440.jpg) | [Capture](product-led-home-light-390.jpg) |
| home/dark | [Capture](product-led-home-dark-1440.jpg) | [Capture](product-led-home-dark-390.jpg) |
| dj/light | [Capture](product-led-dj-light-1440.jpg) | [Capture](product-led-dj-light-390.jpg) |
| dj/dark | [Capture](product-led-dj-dark-1440.jpg) | [Capture](product-led-dj-dark-390.jpg) |
| agency/light | [Capture](product-led-agency-light-1440.jpg) | [Capture](product-led-agency-light-390.jpg) |
| agency/dark | [Capture](product-led-agency-dark-1440.jpg) | [Capture](product-led-agency-dark-390.jpg) |

[Product status, beta conditions and campaign audit](PRODUCT_AND_CAMPAIGN_AUDIT.md). Source images are under `public/images/product/`; they are current interface captures with test data, not live customer accounts. Public catalogue deployment/parity and external conversion definitions remain separate from this frontend review.

Local static-server output should go to a file to avoid filling a long-running tool-output pipe:

```sh
python3 -m http.server 4182 --bind 127.0.0.1 --directory .output/public > /tmp/cuebooker-static.log 2>&1
```

No P1 execution, real signup, invitation, email, billing activation, migration, secret, backend or production operation. Review PR114 before any later main decision.
