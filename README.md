# CareNear local demo

CareNear is a buildless, fictional English-language local concept for arranging thoughtful short caregiver visits in Amsterdam. It includes a search-first landing page, caregiver discovery with portrait cards and illustrated map filtering, a three-step booking flow with a persistent mobile summary, family and caregiver onboarding, an interactive visit lifecycle, a completed visit summary, downloadable receipt, and a caregiver request inbox.

All people, contact details, checks, locations, requests, payments and clinical references are fictional. Amsterdam neighbourhoods, caregiver language coverage and dates are localized for this demo, while the interface remains in English. The app does not connect to a backend, account provider, payment system, messaging service, live map or verification service.

## Run locally

From this directory:

```sh
/Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.mjs
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The server tries ports 5173 through 5177. The browser suites default to the unused QA port 5183:

```sh
PORT=5183 /Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.mjs
```

No install or build step is required.

## Checks

```sh
npm test
npm run check
```

The Node tests cover caregiver filters, the approved price formula, Europe/Amsterdam date handling including malformed dates, booking blockers including someone-else consent, onboarding validation, English receipt content, and runtime/source mirror checks.

With the local server running on port 5183, the focused correction regression suite checks live caregiver prices, service-filter preservation, mobile date selection and focus, onboarding error announcements, and malformed URL handling:

```sh
/Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/browser-corrections.mjs
```

The refinement suite verifies the landing fold and hierarchy, portrait loading, responsive reflow, visit lifecycle, recipient view, trusted-contact validation, booking consent, price continuity and mobile sticky summary:

```sh
/Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/browser-refinement.mjs
```

The Gentiva-informed theme regression suite verifies local font loading, computed type, the exact palette tokens, the black primary action, card boundaries and shadows, the two-line hero, social proof, caregiver media and footer alignment, all hash routes, 320px reflow, map/list switching, sticky booking summary, recipient text, reduced-motion CSS and visible focus:

```sh
/Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/browser-gentiva-theme.mjs
```

Set `BASE_URL` when using another running port:

```sh
BASE_URL=http://127.0.0.1:5183 /Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/browser-gentiva-theme.mjs
```

## Structure

- `index.html` – document shell, semantic navigation, skip link and live regions
- `css/styles.css` – visual system and responsive layouts
- `js/data.js` – fictional Amsterdam caregivers, services, requests and visit fixture
- `js/logic.js` – pure filtering, date, validation, pricing and receipt functions
- `js/app.js` – hash routing, views, forms and local interactions
- `tests/browser-corrections.mjs` – focused Playwright regression checks for corrected behavior
- `tests/browser-refinement.mjs` – focused landing, lifecycle, contact and responsive regression checks
- `tests/browser-gentiva-theme.mjs` – focused Gentiva-informed theme, typography, palette, route and responsive checks
- `assets/caregiver-hero.png` – original generated lifestyle image for the local demo
- `assets/portrait-*.jpg` – locally stored Unsplash portraits for fictional caregiver cards
- `assets/portrait-sources.json` – photographer, page and license provenance
- `assets/fonts/` – locally served Playfair Display and DM Sans TTF files
- `server.mjs` – dependency-free static file server
- `DESIGN.md` – design system, page hierarchy and accessibility decisions
- `docs/agent-work/carenear-demo/REPORT.md` – implementation and QA evidence
- `docs/agent-work/carenear-demo/REFINEMENT-REPORT.md` – refinement QA and source provenance

## Navigation

The app uses local hash routes:

- `#/` – landing page
- `#/discover` – filters, caregiver profiles and map
- `#/book/1` to `#/book/3` – booking wizard, with `#/book/success`
- `#/family-onboarding` – family/seeker setup
- `#/caregiver-onboarding` – caregiver application
- `#/visits` – interactive sample lifecycle, recipient view and completed summary
- `#/requests` – caregiver request inbox

Favorites use `localStorage`. A user-entered trusted contact can use tab-scoped `sessionStorage` and is cleared with the browser tab session. All form, request and visit lifecycle state otherwise stays in memory for the current page.
