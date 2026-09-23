# Cuebooker Design System

Updated: 23 September 2026  
Status: active product system  
Applies to: Workspace, Bookings, Calendar, Activity, Artist Profile, CUE ID, settings and future private product surfaces.

## 1. Product character

Cuebooker should feel industrial, premium and operational. The interface must be dense enough for professional use, but never cramped. The visual language is angular-soft: controlled corners, thin borders, restrained surfaces and limited use of pills or circular controls.

The system must preserve the following principles:

- dark-first product identity;
- light mode designed separately, not mechanically inverted;
- lime in dark mode and violet in light mode as interaction accents;
- colour communicates state or selection, not decoration;
- mobile is a first-class layout;
- compact operational density;
- minimal nested cards;
- typography and spacing create hierarchy before colour;
- no decorative rave, gaming or influencer UI language;
- accessibility and performance are part of the component definition.

## 2. Geometry

### Radius scale

Use these values as the default geometry:

| Token | Value | Use |
| --- | ---: | --- |
| `--cue-radius-xs` | 4px | tiny indicators, compact tags |
| `--cue-radius-sm` | 6px | checkboxes, small controls |
| `--cue-radius-md` | 8px | inputs, buttons, chips |
| `--cue-radius-lg` | 10px | compact panels, grouped controls |
| `--cue-radius-xl` | 12px | large cards and modals |
| `--cue-radius-round` | 999px | exceptional semantic pills only |

### Geometry rules

- Buttons, inputs, chips and selectors default to 8px.
- Cards and panels default to 10px or 12px.
- Checkboxes are square with a small radius, never circular.
- Segmented controls use 8px to 10px on the outer container and 6px to 8px on each segment.
- Pills are reserved for elements whose meaning benefits from the capsule shape, such as a compact BETA badge.
- Avoid mixing 0px, 20px and 999px controls in the same functional area.
- Circular geometry is reserved for true icon-only affordances where the symbol benefits from a circular hit area, for example theme or notification controls.

## 3. Spacing

Cuebooker uses a 4px base grid.

| Token | Value |
| --- | ---: |
| `--cue-space-1` | 4px |
| `--cue-space-2` | 8px |
| `--cue-space-3` | 12px |
| `--cue-space-4` | 16px |
| `--cue-space-5` | 20px |
| `--cue-space-6` | 24px |
| `--cue-space-8` | 32px |
| `--cue-space-10` | 40px |
| `--cue-space-12` | 48px |

### Density rules

Operational screens should normally use:

- 8px between tightly related controls;
- 12px between form fields;
- 16px between subgroups;
- 20px to 24px between sections;
- 32px only for a major contextual break.

Do not add vertical space merely to make a screen feel premium. Premium density comes from alignment, typography, contrast and restraint.

Mobile should usually reduce desktop section gaps by one step. A desktop 24px gap becomes 16px or 20px on mobile when hierarchy remains clear.

## 4. Control heights

| Control | Desktop | Mobile |
| --- | ---: | ---: |
| compact chip | 30px | 32px |
| standard button | 38px | 40px |
| primary CTA | 40px | 42px |
| text input / select | 40px | 42px |
| textarea compact | min 88px | min 96px |
| icon-only control | 38px | 40px |

Avoid 50px to 60px controls in operational screens unless the component belongs to onboarding, marketing or a deliberately high-emphasis empty state.

## 5. Buttons

### Primary

Use the accent background with dark ink in dark mode, or the appropriate theme ink in light mode.

- Height: 40px desktop, 42px mobile.
- Radius: 8px.
- Horizontal padding: 14px to 18px.
- One primary action per local context.
- Full-width primary buttons are valid on narrow mobile layouts.

### Secondary

Use transparent or raised background with a 1px border.

- Do not compete with the primary action.
- Use neutral text by default.
- Accent appears on hover, focus or selected state.

### Tertiary

Use text or icon only.

- No permanent border unless discoverability requires it.
- Keep target size accessible.

### Destructive

Use red only for destructive actions. Do not use red as a generic visual accent.

## 6. Inputs and forms

Inputs should feel like tools, not cards.

- Radius: 8px.
- Border: 1px `var(--cue-border)`.
- Background: `var(--cue-surface)` or transparent depending on surrounding surface.
- Height: 40px desktop, 42px mobile.
- Label to input gap: 6px to 8px.
- Field to field gap: 12px.
- Placeholder uses `var(--cue-dim)`.
- Focus uses the accent border plus focus-visible outline where appropriate.
- Avoid enclosing every field in an additional card.

Operational forms such as Follow-up and Hold should minimise vertical travel. Explanatory copy appears only when it changes a decision or prevents an error.

## 7. Checkboxes, radios and toggles

### Checkbox

Checkboxes are square.

- Size: 18px desktop, 20px mobile.
- Radius: 4px to 6px.
- Border: 1px neutral.
- Checked state: accent fill or accent tick.
- Never use a circular checkbox.

### Radio

Use radios only when the mental model truly represents one choice from a mutually exclusive set. Circular geometry is valid here because it carries semantic meaning.

### Segmented selector

For mode switches such as `En curso / Archivados`, `Cuerpo / Cara`, or `Male / Female`:

- outer radius: 10px;
- segment radius: 8px;
- compact padding;
- active segment uses accent text or a restrained accent surface;
- avoid a 999px capsule unless the control is exceptionally small and isolated.

## 8. Chips and filters

Filters are secondary navigation, not large buttons.

- Height: 30px to 32px.
- Radius: 8px.
- Gap: 4px to 6px.
- Horizontal padding: 10px to 12px.
- Neutral background by default.
- Status colour appears mainly in text and active border/surface.
- On mobile, long groups scroll horizontally.
- Do not wrap into a tall filter dashboard if horizontal scrolling keeps the hierarchy clearer.

Status filters and booking rows should share the same semantic colour mapping.

## 9. Cards and panels

Cuebooker avoids nested box-on-box composition.

### Surface hierarchy

1. page background;
2. primary surface;
3. raised surface only when functional grouping requires it;
4. border or divider for internal hierarchy.

Use one visual boundary per grouping. Do not combine background change, heavy border, shadow and large radius unless the component is a modal or temporary overlay.

### Panel defaults

- radius: 10px to 12px;
- border: 1px solid `var(--cue-border)`;
- padding: 16px desktop;
- padding: 12px to 14px mobile;
- internal section gap: 16px;
- shadow: none on normal workspace panels.

## 10. Status colour system

Colour is a fast operational signal.

Current booking status direction:

| Status | Role |
| --- | --- |
| Nueva | lime / accent |
| En conversación | blue |
| Esperando respuesta | warm amber |
| Confirmada | positive green |
| Rechazada | muted red |
| Cancelada | neutral / subdued red |
| Archivada | neutral |

Rules:

- use the colour in the status label and a small supporting signal such as a left rail;
- do not fill the whole booking row with saturated colour;
- selected rows may use a very low-opacity tint;
- text must keep accessible contrast.

## 11. Typography

### Sans

Use the product sans for titles, body copy, buttons and primary actions.

### Monospace

Use monospace for:

- metadata;
- system labels;
- statuses;
- timestamps;
- technical values;
- compact operational labels.

Do not use monospace for long explanatory paragraphs.

### Hierarchy

Operational UI should prefer a restrained scale:

- page title: 28px to 36px desktop, 26px to 30px mobile;
- section title: 18px to 22px;
- panel title: 14px to 18px;
- body: 13px to 15px;
- metadata: 9px to 11px.

Avoid oversized headings inside the private workspace unless the screen is intentionally editorial, such as CUE ID or Artist Profile presentation moments.

## 12. Borders, shadows and depth

Borders define most product structure.

- standard border: 1px;
- use `var(--cue-border)`;
- dividers may use a lower-opacity border;
- normal workspace cards do not need shadows;
- modals may use a deep shadow;
- avoid glowing borders except for a very specific selected or guided-tour state.

Depth should come from surface contrast and layout before shadow.

## 13. Icons

- Use one icon family per product surface.
- Avoid emoji as interface icons.
- Default icon size: 16px to 20px.
- Icon-only controls require an accessible label.
- Active icons inherit the state colour.
- Decorative icons should not compete with text hierarchy.

## 14. Mobile rules

Mobile is denser, not merely stacked.

- Reduce unused vertical gaps.
- Preserve comfortable touch targets.
- Prefer horizontal scrolling for navigation and filter groups.
- Keep the primary action visible without making every action full width.
- Collapse explanatory copy before reducing useful working space.
- Long operational forms should feel continuous rather than a stack of large cards.
- CUE ID body view must always preserve the full avatar, including footwear.
- Fixed or sticky elements must not cover form controls, conversation content or the avatar.

## 15. Operational screen rules

### Bookings

Bookings behaves like a professional work inbox.

- Conversation is the primary working area.
- Details, decisions, Follow-up and Hold support the thread.
- Filters remain compact.
- Status is readable through label colour plus minimal row signal.
- Follow-up and Hold share one operational zone.
- Avoid dashboard-style equal-weight boxes.

### Artist Profile

Artist Profile is a public-presence builder.

- Publishing state and URL live near the top.
- Public preview is the visual anchor.
- Identity, Image, CUE ID, Sound, Links, Booking and Distribution are editable modules.
- Distribution belongs in the builder, not in a separate mega-card.
- Publishing controls should be compact and not consume disproportionate vertical space.

### CUE ID

CUE ID may be more cinematic, while controls still follow the same product geometry.

- Avatar is always the visual focus.
- Controls use angular-soft geometry.
- Full-body mode always shows footwear.
- 3D effects must degrade gracefully on reduced/static tiers.
- Scene treatment must not force 3D into Profile, public profile, Booking, Calendar or Activity.

## 16. Accessibility

- Minimum target size should remain approximately 40px on mobile where practical.
- Focus-visible must be obvious.
- Status must never rely on colour alone.
- Text contrast must meet accessible standards.
- Disabled controls need more than opacity when ambiguity is possible.
- Avoid hover-only functionality.
- Horizontal scroll regions must still be keyboard accessible.

## 17. Design tokens to standardise

The shared token layer should converge on:

```css
:root {
  --cue-radius-xs: 4px;
  --cue-radius-sm: 6px;
  --cue-radius-md: 8px;
  --cue-radius-lg: 10px;
  --cue-radius-xl: 12px;
  --cue-radius-round: 999px;

  --cue-space-1: 4px;
  --cue-space-2: 8px;
  --cue-space-3: 12px;
  --cue-space-4: 16px;
  --cue-space-5: 20px;
  --cue-space-6: 24px;
  --cue-space-8: 32px;
  --cue-space-10: 40px;
  --cue-space-12: 48px;

  --cue-control-compact: 30px;
  --cue-control-standard: 38px;
  --cue-control-primary: 40px;
  --cue-control-mobile: 42px;
}
```

New components should use these tokens. Existing components should migrate incrementally during visual polish rather than through one risky global rewrite.

## 18. Definition of visual consistency

A screen is visually consistent when:

- the same type of component uses the same radius family;
- spacing follows the 4px scale;
- operational controls stay within the defined height range;
- state colour has semantic meaning;
- there are no unnecessary nested cards;
- mobile preserves useful working area;
- typography establishes hierarchy before decorative treatment;
- the interface feels like one Cuebooker product rather than a collection of independently styled modules.
