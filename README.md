# CareNear

CareNear is a buildless front-end concept for arranging short, non-clinical caregiver visits in Amsterdam. It provides a search-led landing page, caregiver discovery, an illustrative map, a three-step booking flow, family and caregiver onboarding, a sample visit lifecycle, and a caregiver request inbox.

The project is fictional and self-contained. People, profiles, checks, availability, locations, requests, payments, and clinical references are sample data. The application does not connect to a backend, account provider, payment service, messaging service, live map, or verification service.

## Run locally

Start the static server from the project directory:

```sh
node server.mjs
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). If that port is unavailable, the server tries ports 5174–5177.

No installation or build step is required.

## Verification

Run the unit tests and JavaScript syntax checks with:

```sh
npm test
npm run check
```

The test suite covers caregiver filtering, pricing, Europe/Amsterdam date handling, booking validation, onboarding validation, receipt generation, visit lifecycle rules, phone validation, and source-to-`dist` consistency.

Browser regression suites require a running server and a browser environment:

```sh
PORT=5183 node server.mjs
BASE_URL=http://127.0.0.1:5183 node tests/browser-corrections.mjs
BASE_URL=http://127.0.0.1:5183 node tests/browser-refinement.mjs
BASE_URL=http://127.0.0.1:5183 node tests/browser-gentiva-theme.mjs
```

## Project structure

- `index.html` — document shell, navigation, skip link, and live regions
- `css/styles.css` — visual system and responsive layouts
- `js/data.js` — fictional Amsterdam caregivers, services, requests, and visit fixtures
- `js/logic.js` — filtering, date, validation, pricing, and receipt helpers
- `js/app.js` — hash routing, views, forms, and local interactions
- `server.mjs` — dependency-free static file server
- `tests/` — unit and browser regression suites
- `assets/` — local imagery, fonts, and portrait provenance
- `DESIGN.md` — design system, page hierarchy, and accessibility decisions

## Routes

The interface uses local hash routes:

- `#/` — landing page
- `#/discover` — caregiver filters, profiles, and map
- `#/book/1` through `#/book/3` — booking flow, followed by `#/book/success`
- `#/family-onboarding` — family or seeker setup
- `#/caregiver-onboarding` — caregiver application
- `#/visits` — sample visit lifecycle and completed summary
- `#/requests` — caregiver request inbox

Favorites are stored in `localStorage`. Trusted-contact data uses tab-scoped `sessionStorage`; other form and lifecycle state remains in memory for the current page session.
