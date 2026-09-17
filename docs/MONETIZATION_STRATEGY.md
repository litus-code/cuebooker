# Cuebooker monetization strategy

Updated: 17 September 2026
Status: PRODUCT HYPOTHESIS — DO NOT IMPLEMENT BILLING YET

## 1. Principle

Cuebooker should monetize the operational value of the booking workflow, not nickel-and-dime individual entry surfaces.

Public profile, attributed links and the embeddable booking widget are acquisition/ingress surfaces that all feed the same Booking Core. They should not become separate paid add-ons in the first commercial model.

The product promise is:

```text
Wherever the booking starts, Cuebooker keeps it moving.
```

Pricing should therefore preserve one coherent workflow rather than fragmenting it into feature packs.

## 2. Launch hypothesis

Recommended initial commercial model:

- 30-day free trial
- no card required during the first launch/beta phase
- one simple Solo plan after trial
- introductory price target: EUR 15/month
- monthly cancellation
- early adopters can retain a founder price while the product matures

Why 30 days instead of 14/15 days:

- booking demand can be irregular;
- a user needs enough time to publish a profile, distribute links, receive a real enquiry, follow it up and see calendar/history value;
- a 14-day window risks expiring before the user experiences the core loop.

## 3. Solo plan scope

The first paid Solo plan should include the complete core workflow:

- Booking Core
- Contacts / counterparties
- Activity and conversation history
- Next Move / operational follow-up
- Calendar projection
- Public Artist Profile
- Public booking form
- Instagram / WhatsApp / website / EPK / email / link-in-bio attribution links
- Website widget
- Email notifications
- Secure promoter follow-up

Do not charge separately for profile links or the widget in V1. Those capabilities increase activation and booking capture, which improves retention of the paid product.

## 4. AI / Smart Capture

Voice, free-text interpretation, pasted WhatsApp/email capture and future AI assistance should be designed as one Capture Engine.

Do not decide the final AI pricing before real usage/cost data exists.

Initial launch options:

- include a reasonable monthly allowance in Solo;
- meter only unusually high usage later;
- avoid making basic capture dependent on a premium AI tier.

The value proposition is not "AI" itself. The value is turning messy inbound booking context into structured operational work without losing information.

## 5. Manager / Agency future model

Do not implement this pricing before multi-artist workflows are proven.

Likely future structure:

```text
Solo
- 1 managed artist
- 1 primary operator

Manager / Agency
- base workspace subscription
- includes a small number of artists
- additional artist seats / roster capacity
- team permissions and reporting
```

Avoid pricing every user action or every booking. Roster/workspace capacity is more aligned with agency value than transaction fees.

## 6. Beta strategy

For the first external cohort:

- invite a small number of DJs/managers who match the intended workflow;
- give 30 days free;
- explicitly frame the product as an early access/beta with active feedback;
- instrument activation around the real loop:
  - profile published;
  - booking link shared;
  - first enquiry received;
  - first reply/follow-up;
  - first status/Next Move action;
  - first calendar use;
- interview early users before changing pricing.

Do not optimize conversion before activation and retention signals exist.

## 7. Current market context

Current public competitor pricing is materially higher than the proposed early Cuebooker Solo price. For example, Gigwell publicly lists Artist Essentials around USD 49-50/month billed annually and agency plans around USD 99/month. This supports using EUR 15/month as an intentionally accessible early-adopter entry point, but Cuebooker should not position itself as "the cheaper Gigwell". Its differentiation should remain simplicity, modern capture, public artist entry surfaces, centralized conversation and culture-fit for artists/DJs.

## 8. Billing implementation gate

Do not build subscription enforcement yet.

Implement billing only after these product conditions are met:

1. Public Booking Form V2 is stable.
2. Public profile / distribution surfaces are coherent.
3. Notification path is operational.
4. Direct inbound email reply is proven end to end.
5. At least a small external beta cohort has completed the core booking loop.
6. Trial start, activation events and entitlement boundaries are explicitly defined.

Until then, monetization remains documented product strategy rather than code.
