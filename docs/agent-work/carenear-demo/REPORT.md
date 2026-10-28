# CareNear demo implementation report

## STATUS

`ready_for_review`

- Task: `/root/carenear_build`
- Workspace: `/Users/zmilosevich/Desktop/Work/care-near`
- Local URL: [http://127.0.0.1:5174](http://127.0.0.1:5174)
- Server command session: `99138`
- Server process: PID `49463`
- Browser: local Chrome preview kept open for review

Port 5173 was already occupied by an unrelated process. CareNear's server used its designed fallback and is running on 5174.

## Changed paths and behavior

| Path | Result |
| --- | --- |
| `index.html`, `css/styles.css` | Warm editorial responsive shell, complete visual system, semantic landmarks, skip link, native dialogs and reduced-motion handling |
| `js/app.js` | Hash routing, all requested views, filters, map/list selection, favorites, booking, onboarding, visits, requests and accessible interactions |
| `js/data.js` | Fictional Zagreb caregivers, services, requests and completed visit fixture |
| `js/logic.js` | Tested price formula, date handling, filters, booking/onboarding validation and receipt formatting |
| `assets/caregiver-hero.png` | Original generated hero image; fictional subjects and no text or watermark |
| `server.mjs`, `package.json` | Dependency-free local static server with port fallback, no-cache assets and standard safety headers |
| `tests/logic.test.js` | Seven meaningful behavioral tests |
| `tests/browser-corrections.mjs` | Focused Playwright regression suite for the acceptance correction cycle |
| `README.md` | Launch instructions, routes, scope and check commands |
| `DESIGN.md` | Palette and contrast values, typography, page wireframes, both onboarding flows, motion rules, responsive grids and production recommendations |
| `docs/agent-work/carenear-demo/QA/` | Browser screenshots, logs, served response and downloaded receipt fixture |

Implemented behavior:

- Landing search passes service and area into Discover. All four PDF services are present; nursing opens an informational dialog.
- Discover combines service, language and neighbourhood filters, supports an empty/reset state, favorites, linked map pins, caregiver dialogs and mobile List/Map tabs.
- Booking has three URL-addressable steps. Someone-else recipient and consent, date, address, time and caregiver are validated. Back navigation preserves values. Ana at 90 minutes displays €33 care + €4 travel + €5 fee = €42.
- Both onboarding paths validate, preserve values on Back and produce distinct local success boundaries. Caregiver submission remains pending checks.
- A confirmed demo booking becomes an `Awaiting replies` request on Visits, never a completed or paid visit.
- Visits includes the reference-style summary, timeline, downloadable text receipt and prefilled Ana rebooking.
- Caregiver requests support selection, Accept, Decline and reset in local session state.
- Favorites are the only values persisted across reloads; all other demo state remains in page memory.
- User-entered text is escaped before template interpolation.

## Acceptance correction cycle

- Booking inputs update in place. Caregiver changes refresh the review and sticky summary synchronously, clear the acknowledgement, and retain keyboard focus on the selected radio.
- Ana at 90 minutes shows €42, Marko shows €39, and Ivana shows €45. The submitted demo request reports the same selected caregiver and €45 total.
- Service and recipient edits refresh the visible summary without replacing the focused field. Discover and profile booking actions preserve the active service when the caregiver supports it, then fall back to that caregiver's first service.
- Mobile booking now includes a labelled native date input with a minimum of the current Zagreb date. The eight shortcuts remain, a date beyond the shortcuts can be selected, the selected date survives later rerenders, and post-render focus targets the visible mobile control.
- Invalid calendar dates are rejected by booking validation, and date formatting returns a safe label instead of throwing.
- Family and caregiver validation now renders an announced error summary, sets `aria-invalid` and `aria-describedby` on affected controls, and moves focus to the error summary. Successful Continue and Back actions focus the new step heading.
- The static server returns `400 Bad request` for malformed percent encoding and handles request, file-stat and read-stream failures without an uncaught exception.
- The strict AA design wording now states 4.5:1 for normal text, 3:1 for large text and essential UI, and distinguishes the enhanced 44-48px senior target from WCAG 2.1 AA requirements. It identifies 200% text resizing as an unverified acceptance target rather than a completed check.

## Verification

| Command or check | Exit | Salient result |
| --- | --- | --- |
| Bundled `node --check` on `js/app.js`, `js/data.js`, `js/logic.js`, `server.mjs` | 0 | No syntax errors; log at `QA/syntax-check.log` |
| `node --test tests/*.test.js` | 0 | 7 passed, 0 failed; log at `QA/unit-tests.log` |
| Bundled `node tests/browser-corrections.mjs` | 0 | All correction assertions passed; log at `QA/correction-browser-tests.log` |
| `curl` against `http://127.0.0.1:5174/` | 0 | HTTP 200 with expected content type and safety headers; evidence at `QA/http-headers.log` and `QA/served-index.html` |
| Desktop CUA audit, 1280x900, all primary routes | 0 | One H1 per route, zero duplicate IDs, zero unnamed controls, zero horizontal overflow in the final pass |
| Mobile CUA audit, 390x844, all primary routes | 0 | One H1 per route, zero horizontal overflow, zero broken images |
| Narrow reflow at 320x800 | 0 | Document width and viewport width both 320px |
| Browser console inspection | 0 | No warning or error entries |
| Discovery behavior | 0 | Combined filters produced Marko only; impossible combination showed empty state; reset restored four profiles; linked map selection changed to Marko; dialog was modal |
| Booking behavior | 0 | Missing name and consent blocked progression; Back preserved Mara Kralj, consent and 09:30; price showed €42; both confirm controls stayed disabled until acknowledgement; success and pending visit status appeared |
| Family onboarding | 0 | Empty submission produced two inline errors; both step transitions and Back preservation passed; success appeared |
| Caregiver onboarding | 0 | Two first-step errors appeared; review showed pending checks; Back preserved `Trnje`; pending application success appeared |
| Request actions | 0 | Accept and Decline visibly updated, and reset restored the reply-window state |
| Receipt and rebook | 0 | Downloaded receipt contains Ana, Margaret, €42.00 and the demo boundary; Rebook Ana returned to booking step 1 with 90 minutes retained |
| Keyboard/dialog behavior | 0 | Tab focused the skip link with a visible outline; modal opened on the close button; Escape closed it and restored focus to Profile |
| Mobile navigation and map | 0 | Menu opened/navigated/closed; Map tab hid List and exposed four selectable pins without overflow |
| Live booking pricing | 0 | Ana 90 = €42, Marko 90 = €39, Ivana 90 = €45 in both review and summary; final success state matched Ivana and €45 |
| Booking focus and acknowledgement | 0 | Marko and Ivana remained focused after live updates; changing caregiver reset acknowledgement and disabled confirmation |
| Service preservation | 0 | Errands filter carried into Ana's booking; check-in carried through Ivana's profile; unsupported errands fell back to Ivana's appointment service |
| Future mobile date | 0 | Native date input accepted `2026-12-20`, retained it through a time rerender, and returned focus to the visible date field after a shortcut update |
| Onboarding errors and focus | 0 | Both wizards focused and announced the populated error summary, associated field errors through ARIA, and focused the next or previous step heading after successful navigation |
| Malformed server URL | 0 | `/%E0%A4%A` returned `400`; the server remained live |

No paid probe, deployment, account creation, real medical request, payment or external transmission was performed.

## Browser screenshots

- [Desktop landing](QA/landing-desktop.jpg)
- [Mobile landing viewport](QA/landing-mobile-viewport.jpg)
- [Desktop discovery](QA/discover-desktop.jpg)
- [Mobile map](QA/discover-mobile-map.jpg)
- [Desktop booking review](QA/booking-review-desktop.jpg)
- [Mobile booking schedule](QA/booking-mobile.jpg)
- [Desktop visits and receipt](QA/visits-desktop.jpg)
- [Caregiver requests](QA/caregiver-requests-desktop.jpg)
- [Corrected live booking price](QA/correction-booking-live-price.jpg)
- [Corrected mobile date control](QA/correction-mobile-date.jpg)
- [Corrected onboarding error state](QA/correction-onboarding-errors.jpg)

## Outstanding risks and limits

- This is a local product demo. It has no backend, authentication, persistence database, real map, payment, messaging, caregiver allocation or live verification.
- Accessibility work was checked through semantics, focus behavior, contrast calculations, reduced-motion CSS and responsive browser inspection. It is not a formal WCAG certification or screen-reader audit. Formal 200% text-resizing verification remains outstanding; only the documented 320px reflow check was completed.
- Port 5173 remains occupied by another process; the live demo is on 5174.

## Image provenance

The hero was generated with the built-in image generation tool, without the CLI fallback or an API key. The generated file was copied into `assets/caregiver-hero.png`.

Final prompt:

```text
Use case: photorealistic-natural
Asset type: CareNear landing-page hero image
Primary request: A warm, editorial, candid photograph of a female caregiver and an older woman together at the doorway of a Zagreb home, conveying trusted everyday support and human connection.
Scene/backdrop: A refined older Zagreb apartment entry with honey wood, soft limestone, a leafy courtyard glimpse, and subtle teal door.
Subject: Two Croatian women, one caregiver in a coral knit cardigan in her 30s and one older woman in a calm sage blouse in her 70s; natural relaxed expressions, caregiver gently offering an arm.
Style/medium: Premium lifestyle photography, believable skin texture, Keepsake-like warm editorial aesthetic, understated and dignified.
Composition/framing: 3:2 landscape. Subjects placed toward the right half, with a little breathing room; medium-wide, waist up, doorway architecture visible. No text overlay.
Lighting/mood: Soft late-afternoon daylight, warm canvas and mint highlights, reassuring and emotionally grounded.
Color palette: warm ivory, deep teal, muted coral, soft mint, sunflower accent.
Materials/textures: tactile linen, wood grain, stone.
Constraints: fictional subjects, no logos, no text, no watermark, no medical setting, no uniforms, no obvious stock-photo staging.
Avoid: purple tones, sterile clinical atmosphere, exaggerated smiling, children, crowds, generic office interior.
```

## Decisions requiring Astra

None. Integration and acceptance remain with Astra.

## Next checkpoint

Astra acceptance review against `PLAN.md`, followed by integration if accepted.
