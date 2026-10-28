# CareNear design system

## Product direction

CareNear is a fictional, buildless local demo for short care visits in Zagreb. It should help families understand practical support, keep the older adult’s choices visible, and distinguish a demo request from a confirmed visit. All people, checks, ratings, availability, bookings, calls, payments and visit records are illustrative.

This visual system translates the supplied Gentiva reference into CareNear’s own content and structure. It uses editorial serif headlines, restrained charcoal actions, warm ivory surfaces, butter and muted-sage feature blocks, natural photography and compact rounded panels. It does not reuse the reference logo, wording, proprietary imagery or exact composition.

## Palette

| Token | Hex | Role | Contrast |
| --- | --- | --- | --- |
| Canvas | `#F8F5EF` | Page background | 16.06:1 with ink |
| Surface | `#FFFEFA` | Cards and dialogs | Main content surface |
| Ink | `#171A1D` | Main text and iconography | 16.06:1 on canvas |
| Muted | `#565D59` | Supporting copy | 6.21:1 on canvas |
| Primary action | `#111416` | Filled pill actions | 18.49:1 with white text |
| Butter | `#F2E58C` | Highlight blocks, selected cues | Decorative; 13.61:1 with ink |
| Butter soft | `#FBF7D7` | Consent and selected surfaces | Decorative |
| Sage | `#B7C6A5` | Muted feature blocks | Decorative; 9.68:1 with ink |
| Sage soft | `#EDF2E7` | Card and evidence fills | Decorative |
| Warm neutral | `#F0ECE3` | Editorial bands and quiet utilities | Decorative |
| Line | `#DAD8D0` | Optional boundaries and dividers | Structural |
| Control boundary | `#7F8780` | Inputs and essential control outlines | 3.66:1 on surface |
| Accent | `#755819` | Sparse warm rule/text accent | 6.10:1 on canvas |
| Success | `#206044` | Accepted and completed states | Paired with icon/text |
| Warning | `#74500C` on `#FFF4D8` | Pending checks and alerts | Dark semantic treatment |
| Error | `#9E3040` on `#FCEBEE` | Validation and declined states | Dark semantic treatment |
| Info | `#245B75` on `#E8F2F5` | Demo and transparency callouts | Dark semantic treatment |

Butter and sage are decorative fills, not small-text colours. Status always combines colour with text, iconography, a dot or row treatment.

## Typography

All four typefaces are served locally from `assets/fonts/`.

| Role | Family | Rules |
| --- | --- | --- |
| Display and headings | Playfair Display | 500 and 600 only; sentence case; zero letter spacing; 1.02–1.1 line height |
| Body and metadata | DM Sans | 400 and 700; 16px minimum throughout visible UI |

- The landing hero renders at approximately 53px on a 1440px viewport, in two lines.
- At mobile viewports the hero is 40–42px and no more than three lines.
- Body copy is 16px on mobile and 17px on larger screens with a 1.6 line height.
- Eyebrows are restrained warm labels; their size remains at least 16px.
- No negative letter spacing is used.

## Components and layout

### Header

- The desktop header is a floating ivory pill with a thin warm-neutral border and the established two-layer shadow.
- The brand sits at the leading edge, navigation is centred, and Visits/Create account occupy the trailing edge.
- Primary account action is a compact charcoal pill. Secondary navigation is text-led with a pale butter selected state.
- Mobile uses the same floating surface with a 44px circular menu control.

### Landing

- Hero copy and the existing CareNear image form an editorial split. The image carries a restrained butter backing panel and the established soft shadow.
- The anchored search is the main hero action. Its dark pill CTA is the only filled action in that section.
- “See how it works” remains a quiet text link.
- Social proof is a compact four-part editorial strip: a brief framing statement followed by large Playfair figures for visits, rating and reply time.
- Services form an asymmetric bento: 7/5, then 5/7 columns, with butter-soft, ivory, sage-soft and warm-neutral fills and small numbered labels.
- The process remains a connected four-step flow.
- Caregiver cards use large rounded photographs, white surfaces, overlapping rating pills, butter availability pills, restrained sage checks and stable footers with a single black booking action.
- The testimonial becomes a broad warm-neutral editorial panel with a large Playfair quote.
- Consent is a calm sage-outlined evidence card with thin rules, state rows and clear fictional-data boundaries.

### Discovery

- Discovery uses the same floating header and editorial page introduction.
- Filters are grouped in a near-white rounded panel with a charcoal primary action.
- Result cards retain photos, rating/review count, next availability, checks, rate and a black booking action.
- The map shell stays illustrative, using warm-neutral and sage surfaces without claiming live navigation.
- Mobile List/Map segmented controls select one pane; the selected segment uses the primary ink surface.

### Booking

- Progress uses three restrained labels with charcoal completed markers and a butter current-step rule.
- Choices use rounded near-white cards. Selected choices use butter-soft with an ink boundary.
- Calendar days and time/duration controls use a black selected state.
- Booking summaries, date controls and caregiver selection retain their sticky, accessible behavior.
- Mobile summary remains at least 16px throughout and clears the footer when scrolling.

### Onboarding, visits and requests

- Onboarding forms use the same compact rounded cards and evidence treatment.
- Lifecycle status buttons are muted outlined pills; the selected state is butter-soft with an ink border.
- The recipient view retains larger plain-language status copy.
- Request rows use butter-soft selected states and charcoal Accept actions; Decline remains an outlined secondary.
- Contact and profile dialogs use a near-white 14px panel with a thin boundary and softened two-layer shadow.

## Shape, spacing and shadows

- Repeated cards use 8–14px radii.
- Pills are reserved for primary actions, status chips, checks, segmented controls and circular icon actions.
- The established two-layer shadow is:
  - `0 1px 2px rgb(23 26 29 / 5%)`
  - `0 9px 24px rgb(23 26 29 / 6%)`
- Hover uses a small lift and increased shadow. Reduced-motion mode removes transforms and reduces transitions.
- The hero/evidence surfaces may use 12–14px radii. Buttons remain 999px pills.

## Accessibility contract

The implementation targets WCAG 2.1 AA without claiming certification.

- Semantic landmarks, native labels, fieldsets and dialogs remain in use.
- Focus uses a visible 3px outline with 3px offset.
- Primary black buttons exceed AA contrast with white text.
- Input and essential control outlines use the 3.66:1 control-boundary token.
- All visible direct text is verified at 16px or larger across desktop, 390px and every 320px route.
- All routes reflow without horizontal scrolling at 320px.
- Map/list choice, progress, filters, calendar and status expose state semantically.
- Consent remains unchecked by default for someone-else requests.
- Success motion is about 560ms; `prefers-reduced-motion` reduces it and all hover movement.
- Forced-colours mode retains boundaries and selected-state outlines.
- Formal certification and manual assistive-technology testing remain production review work.

## Responsive behaviour

| Width | Behaviour |
| --- | --- |
| 1440px | 1220px frame, floating header, split hero, asymmetric bento services and three caregiver cards |
| 1050px and below | Two-column service bento and booking sidebar compression |
| 900px and below | Floating mobile header, one-column discovery panes and stacked booking/visit summaries |
| 760px and below | Hero copy before image, vertical process connector, single-color bento stack, mobile calendar and sticky summary |
| 560px and below | Single-column filters, social proof and footer; 40–42px hero |
| 320px | Verified three-line maximum hero, 16px minimum text and no horizontal overflow |

## Assets and fictional boundaries

The hero is an original generated image of fictional subjects. Caregiver portraits remain locally stored Unsplash stock, with photographer and licence provenance in `assets/portrait-sources.json`. Provider identities, ratings, reviews, availability and checks are fictional.
