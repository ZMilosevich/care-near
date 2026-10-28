import {
  caregivers,
  caregiverById,
  pastVisit,
  sampleRequests,
  serviceLabel,
  services,
  testimonial,
  visitLifecycle,
} from "./data.js";
import {
  addDaysISO,
  bookingPrice,
  filterCaregivers,
  formatDate,
  isValidPhoneNumber,
  nextVisitStatus,
  normalizeVisitStatus,
  phoneHref,
  receiptText,
  todayInAmsterdam,
  validateBookingStep,
  validateOnboardingStep,
} from "./logic.js";

const main = document.querySelector("#main-content");
const footer = document.querySelector("#site-footer");
const dialogRoot = document.querySelector("#dialog-root");
const liveRegion = document.querySelector("#live-region");
const toast = document.querySelector("#toast");
const menuToggle = document.querySelector("#menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

const today = todayInAmsterdam();

const filters = {
  service: "all",
  language: "all",
  neighborhood: "all",
};

const createBooking = (overrides = {}) => ({
  step: 1,
  forWho: "self",
  recipientName: "",
  consent: false,
  service: "appointment",
  date: addDaysISO(today, 1),
  time: "",
  address: "Prinsengracht 184, Amsterdam",
  duration: 90,
  notes: "",
  caregiverId: "ana",
  calendarMonthOffset: 0,
  reviewAcknowledged: false,
  confirmed: false,
  requestId: "",
  ...overrides,
});

const state = {
  selectedDiscoverId: "ana",
  discoverPane: "list",
  favorites: readFavorites(),
  booking: createBooking(),
  family: {
    step: 1,
    relationship: "",
    services: [],
    language: "",
    contactName: "",
    contactEmail: "",
    consent: false,
    submitted: false,
    errors: {},
  },
  caregiver: {
    step: 1,
    experience: "",
    languages: [],
    neighborhood: "",
    services: [],
    availability: [],
    submitted: false,
    errors: {},
  },
  requests: sampleRequests.map((request) => ({ ...request })),
  selectedRequestId: sampleRequests[0].id,
  bookedRequests: [],
  contact: readContact(),
  visitStatus: "pending",
  visitView: "family",
};

let toastTimer;
let renderFocusSelector = "";

function focusAfterRender(selector) {
  requestAnimationFrame(() => {
    const visibleControl = [...document.querySelectorAll(selector)].find(
      (element) =>
        !element.disabled &&
        element.getClientRects().length > 0,
    );
    visibleControl?.focus();
  });
}

function preferredServiceForCaregiver(caregiver) {
  if (
    filters.service !== "all" &&
    caregiver.services.includes(filters.service)
  ) {
    return filters.service;
  }
  return caregiver.services[0] || "appointment";
}

function readFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem("carenear-favorites") || "[]"));
  } catch {
    return new Set();
  }
}

function readContact() {
  try {
    const contact = JSON.parse(
      sessionStorage.getItem("carenear-trusted-contact") || "{}",
    );
    return {
      name: typeof contact.name === "string" ? contact.name : "",
      phone:
        typeof contact.phone === "string" && isValidPhoneNumber(contact.phone)
          ? contact.phone
          : "",
    };
  } catch {
    return { name: "", phone: "" };
  }
}

function saveContact() {
  try {
    if (state.contact.phone) {
      sessionStorage.setItem(
        "carenear-trusted-contact",
        JSON.stringify(state.contact),
      );
    } else {
      sessionStorage.removeItem("carenear-trusted-contact");
    }
  } catch {
    // The contact remains available for the current rendered page.
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("carenear-favorites", JSON.stringify([...state.favorites]));
  } catch {
    // Favorites remain usable for the current page session.
  }
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return Number.isInteger(value) ? `€${value}` : `€${value.toFixed(2)}`;
}

function icon(name, extraClass = "") {
  const paths = {
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    shopping:
      '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 9v12h14V9M9 21v-7h6v7"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    shield:
      '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-4"/>',
    star:
      '<path d="m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 20l1.1-6.4L2.5 9 9 8Z"/>',
    mapPin:
      '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    map:
      '<path d="m3 6 4-2 5 2 5-2 4 2v14l-4-2-5 2-5-2-4 2V6ZM7 4v14M12 6v14M17 4v14"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    lock:
      '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    download:
      '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    sliders:
      '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    phone:
      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z"/>',
    sparkle:
      '<path d="m12 3-1.3 3.7L7 8l3.7 1.3L12 13l1.3-3.7L17 8l-3.7-1.3L12 3ZM5 14l-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14ZM19 14l-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8L19 14Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  };

  return `<svg class="icon ${extraClass}" aria-hidden="true" viewBox="0 0 24 24">${paths[name] || paths.info}</svg>`;
}

function serviceById(id) {
  return services.find((service) => service.id === id);
}

function renderFooter() {
  footer.innerHTML = `
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="#/" aria-label="CareNear home">
          <svg aria-hidden="true" viewBox="0 0 32 32">
            <path d="M16 28C8.3 23.8 4.8 18.2 6.4 12.3 7.7 7.7 12.7 6 16 10c3.3-4 8.3-2.3 9.6 2.3C27.2 18.2 23.7 23.8 16 28Z" />
            <path d="M16 10v12M11.5 14.5h9" />
          </svg>
          <span>CareNear</span>
        </a>
        <p>Short visits for the moments in between. A fictional local concept designed around dignity, clarity and consent.</p>
        <p class="micro"><strong>Amsterdam demo</strong><br />Monday-Friday, 08:00-18:00</p>
      </div>
      <div class="footer-column">
        <h3>Find support</h3>
        <a href="#/discover">Browse caregivers</a>
        <a href="#/book/1">Request a visit</a>
        <a href="#/visits">Visit summaries</a>
      </div>
      <div class="footer-column">
        <h3>For caregivers</h3>
        <a href="#/caregiver-onboarding">Apply to join</a>
        <a href="#/requests">Caregiver requests</a>
        <a href="#/">How checks work</a>
      </div>
      <div class="footer-column">
        <h3>CareNear</h3>
        <a href="#/family-onboarding">Create an account</a>
        <a href="#/">Contact</a>
        <a href="#/">Privacy</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>CareNear working concept · Amsterdam · 2026</span>
      <span>All names, checks, prices and visit records are illustrative.</span>
    </div>
  `;
}

function setActiveNavigation(route) {
  primaryNav.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    const active =
      (route === "/discover" && href === "#/discover") ||
      (route === "/caregiver-onboarding" && href === "#/caregiver-onboarding") ||
      (route === "/requests" && href === "#/requests");
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  primaryNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  liveRegion.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
}

function portraitMarkup(caregiver, options = {}) {
  return `
    <span class="portrait portrait-${escapeHTML(options.size || "card")} ${escapeHTML(caregiver.color)}">
      <img
        src="${escapeHTML(caregiver.portrait)}"
        alt="${escapeHTML(caregiver.portraitAlt)}"
        width="640"
        height="640"
        loading="eager"
        decoding="async"
        onerror="this.hidden=true;this.parentElement.classList.add('image-missing')"
      >
      <span class="portrait-fallback" aria-hidden="true">${escapeHTML(caregiver.initials)}</span>
    </span>
  `;
}

function caregiverCard(caregiver, options = {}) {
  const selected = options.selected ? " selected" : "";
  const compact = options.compact;
  return `
    <article class="caregiver-card card${selected}${compact ? " caregiver-card-compact" : ""}" data-caregiver-id="${escapeHTML(caregiver.id)}">
      <div class="caregiver-card-media">
        ${portraitMarkup(caregiver, { eager: compact && caregiver.id === "ana" })}
        <button class="favorite" type="button" data-favorite="${escapeHTML(caregiver.id)}" aria-label="${state.favorites.has(caregiver.id) ? "Remove" : "Save"} ${escapeHTML(caregiver.name)}" aria-pressed="${state.favorites.has(caregiver.id)}">
          ${icon("heart")}
        </button>
      </div>
      <div class="caregiver-card-body">
        <div class="caregiver-name">${escapeHTML(caregiver.name)}</div>
        <p class="caregiver-meta">${compact ? `Caregiver · ${caregiver.experience} years’ experience<br>${escapeHTML(caregiver.languages.join(", "))} · ` : `${caregiver.experience} years’ experience · `}${escapeHTML(caregiver.neighborhoods.join(", "))}</p>
        <div class="rating-line">
          <span class="rating-score" aria-label="${caregiver.rating} out of 5 from ${caregiver.reviewCount} sample reviews">${icon("star")} ${caregiver.rating}</span>
          <span>${caregiver.reviewCount} sample reviews</span>
        </div>
        <p class="availability-line">${compact ? `${icon("clock")} Next available:` : "Available"} <strong>${escapeHTML(caregiver.nextAvailability)}</strong></p>
        <div class="badge-block">
          <ul class="checks" aria-label="Illustrative checks">
            ${caregiver.checks.map((check) => compact
              ? `<li class="check-pill">${icon("check")}${escapeHTML(check)}</li>`
              : `<li class="caregiver-check">${escapeHTML(check)}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="caregiver-card-footer">
        <div class="rate">${money(caregiver.rate)} <span>/ hour</span></div>
        <div class="map-selection-actions">
          <button class="text-action" type="button" data-profile="${escapeHTML(caregiver.id)}">Profile${compact ? ` ${icon("arrowRight")}` : ""}</button>
          <a class="button button-small" href="#/book/1" data-book-caregiver="${escapeHTML(caregiver.id)}">Book</a>
        </div>
      </div>
    </article>
  `;
}

function renderLanding() {
  main.innerHTML = `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Care that stays close to home</span>
          <h1><span>Thoughtful care.</span><span>Close to home.</span></h1>
          <p class="lede">Short, practical visits for appointments, errands and check-ins, with clear prices and a reassuring summary afterwards.</p>
          <form class="quick-search hero-search" id="quick-search" novalidate>
            <label>
              <span>What help is needed?</span>
              <select id="quick-service" name="service">
                ${services.filter((service) => !service.unavailable).map((service) => `<option value="${service.id}">${escapeHTML(service.name)}</option>`).join("")}
              </select>
            </label>
            <label>
              <span>Area in Amsterdam</span>
              <select id="quick-area" name="area">
                <option value="all">All neighbourhoods</option>
                <option value="Oud-West">Oud-West</option>
                <option value="Oost">Oost</option>
                <option value="Zuid">Zuid</option>
                <option value="Noord">Noord</option>
              </select>
            </label>
            <button class="button button-large" type="submit">${icon("search")} Find care</button>
          </form>
          <a class="secondary-link" href="#/#how-it-works">See how it works ${icon("arrowRight")}</a>
        </div>
        <div class="hero-media">
          <img src="assets/caregiver-hero.png" alt="Illustrative caregiver and an older woman standing together at an Amsterdam apartment door" width="1536" height="1024" />
          <div class="reassurance-card">
            ${icon("shield")}
            <div>
              <strong>Clear checks. Clear consent.</strong>
              <span>Fictional profiles are marked throughout this demo.</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="social-proof" aria-label="Illustrative CareNear activity">
      <div class="container social-proof-grid">
        <p class="social-proof-intro"><strong>A small circle, made easier to see.</strong><span>Illustrative product data, updated for this demo.</span></p>
        <div class="proof-stat">${icon("calendar")}<span><strong>1,240</strong> sample visits</span></div>
        <div class="proof-stat">${icon("star")}<span><strong>4.9 average</strong> sample rating</span></div>
        <div class="proof-stat">${icon("clock")}<span><strong>2 h</strong> sample reply time</span></div>
      </div>
    </section>

    <section class="section section-rule">
      <div class="container">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Everyday support</span>
            <h2>Help for the moments in between</h2>
          </div>
          <p>Visits from 30 to 120 minutes, with the price and practical details agreed before anything is confirmed.</p>
        </div>
        <div class="service-grid">
          ${services
            .map(
              (service) => `
                ${
                  service.unavailable
                    ? `<button class="service-card card unavailable" type="button" data-nursing-info>`
                    : `<a class="service-card card" href="#/discover" data-service-link="${service.id}">`
                }
                  ${icon(service.icon)}
                  <h3>${escapeHTML(service.name)}</h3>
                  <p>${escapeHTML(service.description)}</p>
                  <span class="card-link">${service.unavailable ? "See demo availability" : "Find a caregiver"} ${icon("arrowRight")}</span>
                ${service.unavailable ? `</button>` : `</a>`}
              `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section section-rule" id="how-it-works">
      <div class="container">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Simple from the start</span>
            <h2>How it works</h2>
          </div>
          <p>One short request, a caregiver you can choose, and a summary you can return to afterwards.</p>
        </div>
        <div class="steps-grid">
          <article class="step-item">${icon("calendar")}<span class="step-number">1</span><h3>Choose a visit</h3><p>Pick the service, date and length that fits the day.</p></article>
          <article class="step-item">${icon("user")}<span class="step-number">2</span><h3>Pick a caregiver</h3><p>Compare experience, language, sample ratings and availability.</p></article>
          <article class="step-item">${icon("phone")}<span class="step-number">3</span><h3>Follow along</h3><p>See a clear status from pending through completion.</p></article>
          <article class="step-item">${icon("check")}<span class="step-number">4</span><h3>Read the summary</h3><p>Review what happened, any follow-up and a clear receipt.</p></article>
        </div>
      </div>
    </section>

    <section class="section section-rule">
      <div class="container">
        <div class="section-heading">
          <div>
            <span class="eyebrow">Meet the local circle</span>
            <h2>A few people who can help</h2>
          </div>
          <div>
            <a class="text-action" href="#/discover">Explore all caregivers ${icon("arrowRight")}</a>
          </div>
        </div>
        <div class="caregiver-rail">
          ${caregivers.slice(0, 3).map((caregiver) => caregiverCard(caregiver, { compact: true })).join("")}
        </div>
      </div>
    </section>

    <section class="section-tight section-rule testimonial-section">
      <div class="container testimonial-panel">
        <div>
          <blockquote>“${escapeHTML(testimonial.quote)}”</blockquote>
          <p class="testimonial-person"><strong>${escapeHTML(testimonial.name)}</strong> · ${escapeHTML(testimonial.persona)}</p>
        </div>
        <div class="testimonial-mark" aria-hidden="true">${icon("heart")}</div>
      </div>
    </section>

    <section class="section-tight section-rule">
      <div class="container consent-panel">
        <div>
          <span class="eyebrow">Their choice comes first</span>
          <h2>Marleen stays in control</h2>
          <p>Older adults decide who sees their information. In this demo, family access starts with an unchecked consent step for requests made on someone else’s behalf.</p>
          <a class="button" href="#/family-onboarding">Set care preferences</a>
        </div>
        <ul class="evidence-rows" aria-label="Illustrative consent states">
            <li><span class="evidence-icon">${icon("user")}</span><span><strong>Recipient control</strong><small>Information sharing starts with their agreement.</small></span><span class="evidence-state">Required</span></li>
            <li><span class="evidence-icon">${icon("lock")}</span><span><strong>Family access</strong><small>No sharing is enabled before consent.</small></span><span class="evidence-state">Unchecked</span></li>
            <li><span class="evidence-icon">${icon("lock")}</span><span><strong>Local demo state</strong><small>No account or invitation is created.</small></span><span class="evidence-state">Demo only</span></li>
        </ul>
      </div>
    </section>

    <section class="section-tight section-rule">
      <div class="container caregiver-cta">
        <div>
          <span class="eyebrow">Bring your experience nearby</span>
          <h2>Are you a caregiver?</h2>
          <p>Set your area, services and hours. The application shows a pending checks state and never implies verification automatically.</p>
        </div>
        <a class="button button-large" href="#/caregiver-onboarding">Apply to join</a>
      </div>
    </section>
  `;

  document.querySelector("#quick-search").addEventListener("submit", (event) => {
    event.preventDefault();
    filters.service = document.querySelector("#quick-service").value;
    filters.neighborhood = document.querySelector("#quick-area").value;
    location.hash = "#/discover";
  });
  main.querySelectorAll("[data-service-link]").forEach((link) => {
    link.addEventListener("click", () => {
      filters.service = link.dataset.serviceLink;
      filters.neighborhood = "all";
      filters.language = "all";
    });
  });
  main.querySelector("[data-nursing-info]").addEventListener("click", openNursingDialog);
  attachCaregiverActions(main);
}

function getFilteredCaregivers() {
  return filterCaregivers(caregivers, filters);
}

function renderDiscover() {
  const results = getFilteredCaregivers();
  if (!results.some((caregiver) => caregiver.id === state.selectedDiscoverId)) {
    state.selectedDiscoverId = results[0]?.id ?? "";
  }
  const selectedCaregiver = caregiverById(state.selectedDiscoverId);

  main.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Local care in Amsterdam</span>
        <h1>Find someone who feels close by.</h1>
        <p class="lede">Browse fictional caregiver profiles, compare clear hourly rates and choose a neighbourhood. Every person, check and location shown is illustrative.</p>
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        <form class="filter-panel card" id="filter-form">
          <div class="field">
            <label for="filter-service">Service</label>
            <select class="select" id="filter-service" name="service">
              <option value="all">All services</option>
              ${services.filter((item) => !item.unavailable).map((item) => `<option value="${item.id}" ${filters.service === item.id ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="filter-language">Language</label>
            <select class="select" id="filter-language" name="language">
              <option value="all">Any language</option>
              ${["Dutch", "English", "German", "Arabic"].map((language) => `<option value="${language}" ${filters.language === language ? "selected" : ""}>${language}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="filter-area">Neighbourhood</label>
            <select class="select" id="filter-area" name="neighborhood">
              <option value="all">All Amsterdam</option>
              ${["Oud-West", "Oost", "Zuid", "Noord"].map((area) => `<option value="${area}" ${filters.neighborhood === area ? "selected" : ""}>${area}</option>`).join("")}
            </select>
          </div>
          <button class="button" type="submit">${icon("sliders")} Apply filters</button>
        </form>
        <div class="mobile-tabs" aria-label="Browse caregivers">
          <div class="segmented">
            <button type="button" data-mobile-tab="list" aria-pressed="${state.discoverPane === "list"}">${icon("list")} List</button>
            <button type="button" data-mobile-tab="map" aria-pressed="${state.discoverPane === "map"}">${icon("map")} Map</button>
          </div>
        </div>
        <div class="discover-layout">
          <div class="discover-pane" data-mobile-hidden="${state.discoverPane !== "list"}">
            <div class="results-header">
              <p aria-live="polite"><strong>${results.length}</strong> illustrative ${results.length === 1 ? "caregiver" : "caregivers"} match</p>
              ${results.length ? `<button class="button button-small button-ghost" type="button" id="clear-filters">Clear filters</button>` : ""}
            </div>
            ${
              results.length
                ? `<div class="caregiver-list">${results.map((caregiver) => caregiverCard(caregiver, { selected: caregiver.id === state.selectedDiscoverId })).join("")}</div>`
                : `<div class="empty-state card">
                    ${icon("search")}
                    <h2>No one matches every filter</h2>
                    <p>Try a different service or neighbourhood, or reset the filters to see the whole local circle.</p>
                    <button class="button" type="button" id="empty-reset">Reset filters</button>
                  </div>`
            }
          </div>
          <aside class="discover-pane map-panel" data-mobile-hidden="${state.discoverPane !== "map"}" aria-label="Illustrative caregiver map">
            <div class="map-head">
              <div>
                <strong>Amsterdam at a glance</strong>
                <p>Illustrative locations · not live navigation</p>
              </div>
            </div>
            <div class="illustrative-map">
              <div class="map-river" aria-hidden="true"></div>
              <div class="map-park" aria-hidden="true"></div>
              <span class="map-label one">Oost</span>
              <span class="map-label two">Oud-West</span>
              <span class="map-label three">Zuid</span>
              <span class="map-label four">Noord</span>
              ${results
                .map(
                  (caregiver) => `
                    <button class="map-pin" type="button" data-map-caregiver="${caregiver.id}" aria-label="Select ${escapeHTML(caregiver.name)} in ${escapeHTML(caregiver.neighborhoods.join(", "))}" aria-pressed="${caregiver.id === state.selectedDiscoverId}" style="left:${caregiver.mapPosition.x}%; top:${caregiver.mapPosition.y}%">
                      <span>${escapeHTML(caregiver.initials)}</span>
                    </button>
                  `,
                )
                .join("")}
            </div>
            <div class="map-selection" aria-live="polite">
              ${
                selectedCaregiver
                  ? `<h2>${escapeHTML(selectedCaregiver.name)}</h2>
                     <p>${escapeHTML(selectedCaregiver.neighborhoods.join(", "))} · ${money(selectedCaregiver.rate)}/hour · ${selectedCaregiver.experience} years</p>
                     <div class="map-selection-actions">
                       <button class="text-action" type="button" data-profile="${selectedCaregiver.id}">View profile ${icon("arrowRight")}</button>
                       <a class="button button-small" href="#/book/1" data-book-caregiver="${selectedCaregiver.id}">Book ${escapeHTML(selectedCaregiver.name.split(" ")[0])}</a>
                     </div>`
                  : `<h2>No caregiver selected</h2><p>Reset the filters to place the fictional caregivers back on the map.</p>`
              }
            </div>
          </aside>
        </div>
      </div>
    </section>
    <section class="section-tight section-rule">
      <div class="container consent-panel">
        <div class="consent-panel-content">
          <span class="eyebrow">A useful distinction</span>
          <h2>Checks are shown, not hidden</h2>
          <p>“ID checked” and “References checked” describe this fictional demo profile. They are not live verification results or a promise of future safety.</p>
          <div class="consent-panel-tags" aria-label="Example profile checks">
            <span>${icon("check")} ID checked</span>
            <span>${icon("check")} References checked</span>
          </div>
          <a class="button button-outline" href="#/family-onboarding">Start your preferences</a>
        </div>
        <div class="consent-panel-art" aria-hidden="true">
          <div class="consent-panel-art-orbit"></div>
          <div class="consent-panel-art-card">
            <span class="consent-panel-art-icon">${icon("shield")}</span>
            <strong>Clear by design</strong>
            <span>See what each profile label means.</span>
          </div>
        </div>
      </div>
    </section>
  `;

  const updateFilters = () => {
    filters.service = document.querySelector("#filter-service").value;
    filters.language = document.querySelector("#filter-language").value;
    filters.neighborhood = document.querySelector("#filter-area").value;
    renderDiscover();
  };
  document.querySelector("#filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    updateFilters();
    showToast("Caregiver list updated.");
  });
  ["#filter-service", "#filter-language", "#filter-area"].forEach((selector) => {
    document.querySelector(selector).addEventListener("change", () => {
      updateFilters();
      focusAfterRender(selector);
    });
  });
  const reset = () => {
    filters.service = "all";
    filters.language = "all";
    filters.neighborhood = "all";
    state.selectedDiscoverId = "ana";
    renderDiscover();
  };
  document.querySelector("#clear-filters")?.addEventListener("click", reset);
  document.querySelector("#empty-reset")?.addEventListener("click", reset);
  main.querySelectorAll("[data-map-caregiver]").forEach((pin) => {
    pin.addEventListener("click", () => {
      state.selectedDiscoverId = pin.dataset.mapCaregiver;
      renderDiscover();
      focusAfterRender(`[data-map-caregiver="${state.selectedDiscoverId}"]`);
    });
  });
  main.querySelectorAll("[data-mobile-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.discoverPane = button.dataset.mobileTab;
      renderDiscover();
      focusAfterRender(`[data-mobile-tab="${state.discoverPane}"]`);
    });
  });
  attachCaregiverActions(main);
}

function attachCaregiverActions(root) {
  root.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.favorite;
      const caregiver = caregiverById(id);
      if (state.favorites.has(id)) state.favorites.delete(id);
      else state.favorites.add(id);
      saveFavorites();
      showToast(
        `${caregiver.name} ${state.favorites.has(id) ? "saved to" : "removed from"} favorites.`,
      );
      button.setAttribute("aria-pressed", state.favorites.has(id));
      button.setAttribute(
        "aria-label",
        `${state.favorites.has(id) ? "Remove" : "Save"} ${caregiver.name}`,
      );
    });
  });
  root.querySelectorAll("[data-profile]").forEach((button) => {
    button.addEventListener("click", () => openProfile(button.dataset.profile));
  });
  root.querySelectorAll("[data-book-caregiver]").forEach((link) => {
    link.addEventListener("click", () => {
      const caregiver = caregiverById(link.dataset.bookCaregiver);
      if (!caregiver) return;
      state.booking = createBooking({
        caregiverId: caregiver.id,
        service: preferredServiceForCaregiver(caregiver),
      });
    });
  });
}

function openProfile(id) {
  const caregiver = caregiverById(id);
  if (!caregiver) return;
  dialogRoot.innerHTML = `
    <dialog class="dialog profile-dialog" id="app-dialog" aria-labelledby="dialog-title">
      <div class="profile-header">
        ${portraitMarkup(caregiver, { size: "profile", eager: true })}
        <div class="profile-identity">
          <h2 id="dialog-title">${escapeHTML(caregiver.name)}</h2>
          <p>${escapeHTML(caregiver.role)} · ${caregiver.experience} years’ experience</p>
          <div class="rating-line"><span class="rating-score">${icon("star")} ${caregiver.rating}</span><span>${caregiver.reviewCount} sample reviews</span></div>
        </div>
        <button class="dialog-close" type="button" data-close-dialog aria-label="Close profile">${icon("x")}</button>
      </div>
      <div class="profile-content">
        <dl class="profile-facts">
          <div><dt>Neighbourhood</dt><dd>${escapeHTML(caregiver.neighborhoods.join(", "))}</dd></div>
          <div><dt>Languages</dt><dd>${escapeHTML(caregiver.languages.join(", "))}</dd></div>
        </dl>
        <section class="profile-section" aria-labelledby="profile-about">
          <h3 id="profile-about">A little about ${escapeHTML(caregiver.name.split(" ")[0])}</h3>
          <p>${escapeHTML(caregiver.detail)}</p>
        </section>
        <div class="profile-detail-grid">
          <section class="profile-section" aria-labelledby="profile-services">
            <h3 id="profile-services">Can help with</h3>
            <ul class="profile-list">${caregiver.services.map((id) => `<li>${icon("check")}<span>${escapeHTML(serviceLabel(id))}</span></li>`).join("")}</ul>
          </section>
          <section class="profile-section" aria-labelledby="profile-checks">
            <h3 id="profile-checks">Profile checks</h3>
            <ul class="profile-list">${caregiver.checks.map((check) => `<li>${icon("check")}<span>${escapeHTML(check)}</span></li>`).join("")}</ul>
          </section>
        </div>
      </div>
      <div class="profile-footer">
        <div class="profile-booking-summary">
          <div class="rate">${money(caregiver.rate)} <span>/ hour</span></div>
          <p>Next available <strong>${escapeHTML(caregiver.nextAvailability)}</strong></p>
        </div>
        <button class="button" type="button" data-dialog-book="${caregiver.id}">Book ${escapeHTML(caregiver.name.split(" ")[0])}</button>
      </div>
    </dialog>
  `;
  const dialog = document.querySelector("#app-dialog");
  dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });
  dialog.querySelector("[data-dialog-book]").addEventListener("click", () => {
    const id = dialog.querySelector("[data-dialog-book]").dataset.dialogBook;
    const caregiver = caregiverById(id);
    if (!caregiver) return;
    state.booking = createBooking({
      caregiverId: id,
      service: preferredServiceForCaregiver(caregiver),
    });
    dialog.close();
    location.hash = "#/book/1";
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.showModal();
}

function openNursingDialog() {
  dialogRoot.innerHTML = `
    <dialog class="dialog" id="app-dialog" aria-labelledby="dialog-title">
      <div class="dialog-header">
        <div>
          <h2 id="dialog-title">Nursing visits are informational here</h2>
          <p class="muted">This local concept does not offer clinical booking.</p>
        </div>
        <button class="dialog-close" type="button" data-close-dialog aria-label="Close nursing information">${icon("x")}</button>
      </div>
      <div class="dialog-body">
        <p>A future production service would list only licensed nurses with verified credentials and enabled clinical services. No nurse is bookable in this demo.</p>
        <div class="callout warning"><p>Use emergency services for urgent medical needs. CareNear’s fictional short visits do not replace clinical care.</p></div>
        <button class="button" type="button" data-close-dialog>Return to services</button>
      </div>
    </dialog>
  `;
  const dialog = document.querySelector("#app-dialog");
  dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });
  dialog.showModal();
}

function refreshContactTriggers() {
  document.querySelectorAll("[data-open-contact]").forEach((button) => {
    const mobileLabel = state.contact.phone ? "Call contact" : "Call someone";
    button.innerHTML = `${icon("phone")} ${
      button.classList.contains("mobile-contact-action")
        ? mobileLabel
        : state.contact.phone
          ? "Call your contact"
          : "Set up a call contact"
    }`;
  });
}

function openContactDialog(error = "") {
  document.querySelector("#app-dialog[open]")?.close();
  const savedPhone = state.contact.phone;
  const savedHref = phoneHref(savedPhone);
  dialogRoot.innerHTML = `
    <dialog class="dialog" id="app-dialog" aria-labelledby="contact-dialog-title">
      <div class="dialog-header">
        <div>
          <h2 id="contact-dialog-title">Call someone you trust</h2>
          <p class="muted">Choose a person and number for this browser page.</p>
        </div>
        <button class="dialog-close" type="button" data-close-dialog aria-label="Close contact setup">${icon("x")}</button>
      </div>
      <div class="dialog-body">
        <div class="callout">
          <p>Your number stays in this page session only. CareNear does not place calls or use an emergency or support number.</p>
        </div>
        <form id="contact-form" novalidate>
          <div class="field-grid">
            <div class="field">
              <label for="contact-name">Contact name <span class="muted">(optional)</span></label>
              <input class="input" id="contact-name" name="contactName" autocomplete="name" value="${escapeHTML(state.contact.name)}" placeholder="For example, Eva">
            </div>
            <div class="field">
              <label for="contact-phone">Phone number</label>
              <input class="input" id="contact-phone" name="contactPhone" type="tel" inputmode="tel" autocomplete="tel" value="${escapeHTML(savedPhone)}" aria-invalid="${Boolean(error)}" ${error ? 'aria-describedby="contact-phone-error"' : ""}>
              <p class="helper">Use digits and phone characters such as +, spaces, hyphens or parentheses.</p>
              ${error ? `<p class="field-error" id="contact-phone-error" role="alert">${escapeHTML(error)}</p>` : ""}
            </div>
          </div>
          <div class="page-actions">
            <button class="button" type="submit">Save for this page</button>
            ${savedHref ? `<a class="button button-outline" href="${escapeHTML(savedHref)}" data-explicit-dialer>Open dialer for ${escapeHTML(state.contact.name || "your contact")}</a>` : ""}
          </div>
        </form>
      </div>
    </dialog>
  `;
  const dialog = document.querySelector("#app-dialog");
  dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });
  const form = dialog.querySelector("#contact-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.elements.contactName.value.trim();
    const phone = form.elements.contactPhone.value.trim();
    if (!isValidPhoneNumber(phone)) {
      openContactDialog(
        "Enter a phone number using digits and phone characters only.",
      );
      return;
    }
    state.contact = {
      name,
      phone,
    };
    saveContact();
    dialog.close();
    refreshContactTriggers();
    openContactDialog();
    liveRegion.textContent = "Trusted contact saved for this page session.";
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.showModal();
  if (error) {
    requestAnimationFrame(() =>
      dialog.querySelector("#contact-phone")?.focus(),
    );
  }
}

function errorFor(errors, field, id = `${field}-error`) {
  return errors[field]
    ? `<p class="field-error" id="${id}">${escapeHTML(errors[field])}</p>`
    : "";
}

function bookingSummary(step) {
  const selected = caregiverById(state.booking.caregiverId);
  const price = selected
    ? bookingPrice(selected.rate, state.booking.duration)
    : 0;
  const serviceName = state.booking.service
    ? serviceLabel(state.booking.service)
    : "Not chosen yet";
  return `
    <aside class="summary-card card" aria-label="Booking summary" aria-live="polite">
      <h2>Your demo request</h2>
      <div class="summary-row"><span>Service</span><strong>${escapeHTML(serviceName)}</strong></div>
      <div class="summary-row"><span>When</span><strong>${formatDate(state.booking.date)} · ${escapeHTML(state.booking.time || "Choose a time")}</strong></div>
      <div class="summary-row"><span>Length</span><strong>${state.booking.duration} minutes</strong></div>
      <div class="summary-row"><span>For</span><strong>${escapeHTML(state.booking.forWho === "someone" ? state.booking.recipientName || "Someone else" : "Marleen de Boer")}</strong></div>
      ${step >= 2 && selected ? `<div class="summary-row"><span>Caregiver</span><strong>${escapeHTML(selected.name)}</strong></div>` : ""}
      ${
        step >= 2 && selected
          ? `<div class="summary-row"><span>Care</span><strong>${money((selected.rate * state.booking.duration) / 60)}</strong></div>
             <div class="summary-row"><span>Travel</span><strong>${money(4)}</strong></div>
             <div class="summary-row"><span>Service fee</span><strong>${money(5)}</strong></div>
             <div class="summary-row summary-total"><span>Total</span><strong>${money(price)}</strong></div>`
          : `<div class="callout" style="margin-top: 18px"><p>The exact caregiver and total appear before the final review step.</p></div>`
      }
      ${step === 3 ? `<button class="button button-coral summary-actions" type="submit" form="booking-form" data-booking-confirm disabled>Request demo booking</button>` : ""}
      <button class="button button-outline summary-actions contact-action" type="button" data-open-contact>${icon("phone")} ${state.contact.phone ? "Call your contact" : "Set up a call contact"}</button>
      <div class="sidebar-note">
        <strong>Clear from the start</strong><br>
        Transport is not included. Free cancellation applies until 24 hours before the visit in this illustrative policy.
      </div>
    </aside>
  `;
}

function mobileBookingSummaryMarkup() {
  const selected = caregiverById(state.booking.caregiverId);
  const price = selected
    ? bookingPrice(selected.rate, state.booking.duration)
    : 0;
  return `
    <aside class="mobile-booking-summary card" id="mobile-booking-summary" aria-label="Persistent booking summary">
      <div class="mobile-summary-bar">
        <div>
          <strong>${escapeHTML(selected?.name || "Choose a caregiver")}</strong>
          <span>${escapeHTML(state.booking.time || "Choose a time")}</span>
        </div>
        <div class="mobile-summary-total">
          <span>Total</span>
          <strong>${selected ? money(price) : "Pending"}</strong>
        </div>
        <button class="text-action mobile-contact-action" type="button" data-open-contact>${icon("phone")} ${state.contact.phone ? "Call contact" : "Call someone"}</button>
      </div>
      <details>
        <summary>View visit details</summary>
        <div class="mobile-summary-details">
          <div class="summary-row"><span>Service</span><strong>${escapeHTML(serviceLabel(state.booking.service))}</strong></div>
          <div class="summary-row"><span>Date</span><strong>${formatDate(state.booking.date)}</strong></div>
          <div class="summary-row"><span>Duration</span><strong>${state.booking.duration} minutes</strong></div>
          <div class="summary-row"><span>For</span><strong>${escapeHTML(state.booking.forWho === "someone" ? state.booking.recipientName || "Someone else" : "Marleen de Boer")}</strong></div>
        </div>
      </details>
    </aside>
  `;
}

function bookingReviewDetailsMarkup() {
  const selected = caregiverById(state.booking.caregiverId);
  const price = selected
    ? bookingPrice(selected.rate, state.booking.duration)
    : 0;
  return `
    <div class="summary-row"><span>Service</span><strong>${escapeHTML(serviceLabel(state.booking.service))}</strong></div>
    <div class="summary-row"><span>Date</span><strong>${formatDate(state.booking.date, { year: true })}</strong></div>
    <div class="summary-row"><span>Start</span><strong>${escapeHTML(state.booking.time || "Choose a time")}</strong></div>
    <div class="summary-row"><span>Address</span><strong>${escapeHTML(state.booking.address)}</strong></div>
    <div class="summary-row"><span>Duration</span><strong>${state.booking.duration} minutes</strong></div>
    ${
      state.booking.forWho === "someone"
        ? `<div class="summary-row"><span>Person</span><strong>${escapeHTML(state.booking.recipientName)}</strong></div>
           <div class="summary-row"><span>Permission</span><strong>${state.booking.consent ? "Confirmed for this request" : "Not confirmed"}</strong></div>`
        : ""
    }
    <div class="summary-row"><span>Caregiver</span><strong>${escapeHTML(selected?.name || "Not selected")}</strong></div>
    <div class="summary-row summary-total"><span>Total</span><strong>${selected ? money(price) : "Choose a caregiver"}</strong></div>
  `;
}

function refreshBookingSummary() {
  const summary = document.querySelector(
    ".booking-layout .summary-card",
  );
  if (summary) {
    summary.outerHTML = bookingSummary(state.booking.step);
  }
  const mobileSummary = document.querySelector("#mobile-booking-summary");
  if (mobileSummary) {
    mobileSummary.outerHTML = mobileBookingSummaryMarkup();
  }
}

function refreshBookingReview() {
  const review = document.querySelector("#booking-review-details");
  if (review) review.innerHTML = bookingReviewDetailsMarkup();
}

function updateBookingConfirmState() {
  const acknowledgement = document.querySelector("#review-ack");
  if (!acknowledgement) return;
  const hasValidationErrors = [1, 2, 3].some(
    (bookingStep) =>
      Object.keys(
        validateBookingStep(bookingStep, state.booking, today),
      ).length > 0,
  );
  document.querySelectorAll("[data-booking-confirm]").forEach((button) => {
    button.disabled =
      !acknowledgement.checked || hasValidationErrors;
  });
}

function renderProgress(step, labels) {
  return `
    <ol class="progress" aria-label="Progress">
      ${labels.map((label, index) => {
        const number = index + 1;
        const done = number < step;
        const active = number === step;
        return `<li class="${active ? "active" : done ? "done" : ""}" ${active ? 'aria-current="step"' : ""}>
          <span class="progress-marker" aria-hidden="true">${done ? icon("check") : number}</span>
          <span class="progress-kicker">Step ${number}${done ? '<span class="sr-only">, completed</span>' : ""}</span>
          <span class="progress-label">${escapeHTML(label)}</span>
        </li>`;
      }).join("")}
    </ol>
  `;
}

function renderBookingStep(step) {
  const errors = {};
  if (step === 1) {
    return `
      <div class="form-section">
        <h2>Who is the visit for?</h2>
        <p>Marleen’s saved profile is fictional demo content.</p>
        <div class="choice-grid">
          <label class="choice-card">
            <input type="radio" name="forWho" value="self" data-booking-field="forWho" ${state.booking.forWho === "self" ? "checked" : ""}>
            <div class="choice-copy"><strong>Marleen de Boer</strong><span>Myself · saved demo profile</span></div>
          </label>
          <label class="choice-card">
            <input type="radio" name="forWho" value="someone" data-booking-field="forWho" ${state.booking.forWho === "someone" ? "checked" : ""}>
            <div class="choice-copy"><strong>Someone else</strong><span>Request a visit on their behalf</span></div>
          </label>
        </div>
        ${
          state.booking.forWho === "someone"
            ? `<div class="field" style="margin-top: 16px">
                 <label for="recipient-name">Their name <span class="required">*</span></label>
                 <input class="input" id="recipient-name" data-booking-field="recipientName" value="${escapeHTML(state.booking.recipientName)}" aria-invalid="${Boolean(errors.recipientName)}">
                 ${errorFor(errors, "recipientName")}
               </div>
               <label class="check-control" style="margin-top: 14px">
                 <input type="checkbox" data-booking-field="consent" ${state.booking.consent ? "checked" : ""}>
                 <span>I have permission from ${escapeHTML(state.booking.recipientName || "the person receiving care")} to make this request. They stay in control of what family can see, and this permission can change.</span>
               </label>
               ${errorFor(errors, "consent")}`
            : ""
        }
      </div>
      <fieldset class="form-section" style="border: 0; padding-inline: 0" aria-labelledby="booking-service-heading">
        <legend class="sr-only">What help is needed?</legend>
        <h2 id="booking-service-heading">What help is needed?</h2>
        <p>Choose one service for this visit.</p>
        <div class="choice-grid">
          ${services
            .filter((service) => !service.unavailable)
            .map(
              (service) => `
                <label class="choice-card">
                  <input type="radio" name="service" value="${service.id}" data-booking-field="service" ${state.booking.service === service.id ? "checked" : ""}>
                  ${icon(service.icon)}
                  <div class="choice-copy"><strong>${escapeHTML(service.name)}</strong><span>${escapeHTML(service.short)}</span></div>
                </label>
              `,
            )
            .join("")}
        </div>
        ${errorFor(errors, "service")}
      </fieldset>
      <div class="wizard-actions">
        <a class="button button-outline" href="#/discover">${icon("arrowLeft")} Back to caregivers</a>
        <button class="button" type="submit">Continue ${icon("arrowRight")}</button>
      </div>
    `;
  }

  if (step === 2) {
    return `
      <div class="form-section">
        <h2>When and where?</h2>
        <p>Choose a future date and a practical arrival window. Today in Amsterdam is ${formatDate(today, { year: true })}.</p>
        <div class="field-grid">
          <div class="field span-full desktop-calendar">
            <span class="field-label" id="date-label">Visit date <span class="required">*</span></span>
            ${calendarMarkup()}
            ${errorFor(errors, "date")}
          </div>
          <div class="field span-full mobile-date-agenda">
            <label class="field-label" for="mobile-visit-date">Visit date <span class="required">*</span></label>
            <input class="input" id="mobile-visit-date" type="date" min="${today}" value="${escapeHTML(state.booking.date)}" data-booking-field="date">
            <p class="helper">Choose any future date, or use a nearby shortcut.</p>
            <div class="choice-grid">
              ${Array.from({ length: 8 }, (_, index) => addDaysISO(today, index + 1))
                .map((date) => `<button class="button button-small ${state.booking.date === date ? "" : "button-outline"}" type="button" data-booking-date="${date}" aria-pressed="${state.booking.date === date}">${formatDate(date)}</button>`)
                .join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="form-section">
        <h2>Start time</h2>
        <p>These are illustrative arrival times.</p>
        <div class="time-grid" role="group" aria-label="Start time">
          ${["09:30", "11:00", "14:00", "16:30"].map((time) => `<button type="button" data-booking-time="${time}" aria-pressed="${state.booking.time === time}">${time}</button>`).join("")}
        </div>
        ${errorFor(errors, "time")}
      </div>
      <div class="form-section">
        <h2>Visit address</h2>
        <div class="field-grid">
          <div class="field span-full">
            <label for="visit-address">Address <span class="required">*</span></label>
            <input class="input" id="visit-address" autocomplete="street-address" data-booking-field="address" value="${escapeHTML(state.booking.address)}" aria-invalid="${Boolean(errors.address)}">
            ${errorFor(errors, "address")}
          </div>
        </div>
      </div>
      <div class="form-section">
        <h2>How long?</h2>
        <p>Travel and service fees are shown separately on the next step.</p>
        <div class="duration-grid" role="group" aria-label="Visit duration">
          ${[30, 60, 90, 120].map((duration) => `<button type="button" data-booking-duration="${duration}" aria-pressed="${Number(state.booking.duration) === duration}">${duration} min</button>`).join("")}
        </div>
        ${errorFor(errors, "duration")}
      </div>
      <div class="form-section">
        <label class="field" for="visit-notes">
          <span class="field-label">Anything the caregiver should know?</span>
          <textarea class="textarea" id="visit-notes" data-booking-field="notes" placeholder="For example: stairs are slow, please call on arrival, or a taxi is already arranged.">${escapeHTML(state.booking.notes)}</textarea>
          <span class="helper">Avoid medical details that are not needed for this visit.</span>
        </label>
      </div>
      <div class="wizard-actions">
        <button class="button button-outline" type="button" data-booking-back>${icon("arrowLeft")} Back</button>
        <button class="button" type="submit">Continue ${icon("arrowRight")}</button>
      </div>
    `;
  }

  const available = caregivers.filter((caregiver) =>
    caregiver.services.includes(state.booking.service),
  );
  if (
    state.booking.caregiverId &&
    !available.some((caregiver) => caregiver.id === state.booking.caregiverId)
  ) {
    state.booking.caregiverId = available[0]?.id ?? "";
  }
  return `
    <div class="form-section">
      <h2>Choose a caregiver</h2>
      <p>Compare experience, language and illustrative checks for this service.</p>
      <div class="caregiver-option-list">
        ${available
          .map(
            (caregiver) => `
              <div class="caregiver-option">
                <input type="radio" id="caregiver-${caregiver.id}" name="caregiver" value="${caregiver.id}" data-booking-field="caregiverId" ${state.booking.caregiverId === caregiver.id ? "checked" : ""}>
                <label for="caregiver-${caregiver.id}">
                  <div class="caregiver-top">
                    ${portraitMarkup(caregiver, { size: "option" })}
                    <div>
                      <div class="caregiver-name">${escapeHTML(caregiver.name)}</div>
                      <p class="caregiver-meta">${caregiver.experience} years · ${escapeHTML(caregiver.languages.join(", "))}</p>
                    </div>
                    <div class="rate">${money(caregiver.rate)}<span>/h</span></div>
                  </div>
                  <div class="rating-line">
                    <span class="rating-score">${icon("star")} ${caregiver.rating}</span>
                    <span>${caregiver.reviewCount} sample reviews</span>
                    <span>${escapeHTML(caregiver.nextAvailability)}</span>
                  </div>
                  <ul class="checks">${caregiver.checks.map((check) => `<li class="check-pill">${icon("check")}${escapeHTML(check)}</li>`).join("")}</ul>
                  <div class="caregiver-card-footer"><span class="muted micro">Illustrative checks</span><span class="tag">${escapeHTML(serviceLabel(state.booking.service))}</span></div>
                </label>
              </div>
            `,
          )
          .join("")}
      </div>
      ${errorFor(errors, "caregiverId")}
    </div>
    <div class="form-section">
      <h2>Review before sending</h2>
      <div id="booking-review-details" aria-live="polite">${bookingReviewDetailsMarkup()}</div>
      <div class="callout warning" style="margin-top: 20px"><p><strong>Transport is separate.</strong> The caregiver can accompany by taxi, paid directly to the provider. This is an illustrative policy.</p></div>
      <label class="check-control" style="margin-top: 16px">
        <input id="review-ack" type="checkbox" data-booking-field="reviewAcknowledged" required ${state.booking.reviewAcknowledged ? "checked" : ""}>
        <span>I understand this is a demo request. No booking, payment, message or verification is created.</span>
      </label>
      <div class="wizard-actions">
        <button class="button button-outline" type="button" data-booking-back>${icon("arrowLeft")} Back</button>
        <button class="button button-coral" type="submit" id="booking-confirm" data-booking-confirm disabled>Request demo booking</button>
      </div>
    </div>
  `;
}

function calendarMarkup() {
  const base = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  base.setUTCMonth(base.getUTCMonth() + state.booking.calendarMonthOffset);
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const jsFirstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const mondayIndex = (jsFirstDay + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(base);
  const cells = [];
  for (let index = 0; index < mondayIndex; index += 1) {
    cells.push("<span aria-hidden=\"true\"></span>");
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const date = new Date(`${iso}T12:00:00Z`);
    const label = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
    const disabled = iso < today;
    cells.push(
      `<button class="calendar-day" type="button" data-booking-date="${iso}" aria-label="${label}" aria-pressed="${state.booking.date === iso}" ${disabled ? "disabled" : ""}>${day}</button>`,
    );
  }
  const atCurrentMonth = state.booking.calendarMonthOffset === 0;
  return `
    <div class="calendar">
      <div class="calendar-head">
        <button class="icon-button" type="button" data-calendar-prev aria-label="Previous month" ${atCurrentMonth ? "disabled" : ""}>${icon("arrowLeft")}</button>
        <strong>${escapeHTML(monthLabel)}</strong>
        <button class="icon-button" type="button" data-calendar-next aria-label="Next month">${icon("arrowRight")}</button>
      </div>
      <div class="calendar-grid" role="group" aria-labelledby="date-label">
        ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<span class="dow" aria-hidden="true">${day}</span>`).join("")}
        ${cells.join("")}
      </div>
    </div>
  `;
}

function renderBooking(step) {
  if (state.booking.confirmed && step !== "success") {
    state.booking = createBooking({ step });
  } else {
    state.booking.step = step;
  }
  main.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb"><a href="#/discover">Find care</a><span aria-hidden="true">/</span><span>Book a visit</span></div>
        <span class="eyebrow">A clear request in three steps</span>
        <h1>Book a visit</h1>
        <p class="lede">Describe the help needed, choose a time and review the full price before sending a demo request.</p>
        ${renderProgress(step, ["Visit details", "Date and place", "Caregiver and review"])}
      </div>
    </section>
    <section class="section-tight">
      <div class="container">
        ${mobileBookingSummaryMarkup()}
        <div class="booking-layout">
          <div class="booking-main card">
            <form id="booking-form" novalidate>
              <div id="booking-errors" aria-live="polite"></div>
              ${renderBookingStep(step)}
            </form>
          </div>
          ${bookingSummary(step)}
        </div>
      </div>
    </section>
  `;

  const form = document.querySelector("#booking-form");
  form.addEventListener("input", handleBookingInput);
  form.addEventListener("change", handleBookingInput);
  form.addEventListener("submit", handleBookingSubmit);
  main.querySelectorAll("[data-booking-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.booking.date = button.dataset.bookingDate;
      renderBooking(2);
      focusAfterRender(
        `#mobile-visit-date, [data-booking-date="${state.booking.date}"]:not(:disabled)`,
      );
    });
  });
  main.querySelectorAll("[data-booking-time]").forEach((button) => {
    button.addEventListener("click", () => {
      state.booking.time = button.dataset.bookingTime;
      renderBooking(2);
      focusAfterRender(`[data-booking-time="${state.booking.time}"]`);
    });
  });
  main.querySelectorAll("[data-booking-duration]").forEach((button) => {
    button.addEventListener("click", () => {
      state.booking.duration = Number(button.dataset.bookingDuration);
      renderBooking(2);
      focusAfterRender(`[data-booking-duration="${state.booking.duration}"]`);
    });
  });
  main.querySelector("[data-booking-back]")?.addEventListener("click", () => {
    renderBooking(Math.max(1, step - 1));
    location.hash = `#/book/${Math.max(1, step - 1)}`;
  });
  main.querySelector("[data-calendar-prev]")?.addEventListener("click", () => {
    state.booking.calendarMonthOffset = Math.max(0, state.booking.calendarMonthOffset - 1);
    renderBooking(2);
    focusAfterRender("[data-calendar-prev]");
  });
  main.querySelector("[data-calendar-next]")?.addEventListener("click", () => {
    state.booking.calendarMonthOffset += 1;
    renderBooking(2);
    focusAfterRender("[data-calendar-next]");
  });
  updateBookingConfirmState();
}

function handleBookingInput(event) {
  if (
    event.type === "input" &&
    (event.target.type === "checkbox" || event.target.type === "radio")
  ) {
    return;
  }
  const field = event.target.dataset.bookingField;
  if (!field) return;
  if (event.target.type === "checkbox") state.booking[field] = event.target.checked;
  else state.booking[field] = event.target.value;

  if (field === "forWho") {
    state.booking.consent = false;
    state.booking.recipientName = "";
    state.booking.reviewAcknowledged = false;
    renderBooking(1);
    focusAfterRender(
      `[data-booking-field="forWho"][value="${state.booking.forWho}"]`,
    );
    return;
  }

  if (field === "caregiverId") {
    state.booking.reviewAcknowledged = false;
    const acknowledgement = document.querySelector("#review-ack");
    if (acknowledgement) acknowledgement.checked = false;
    refreshBookingSummary();
    refreshBookingReview();
    updateBookingConfirmState();
    return;
  }

  if (field === "reviewAcknowledged") {
    updateBookingConfirmState();
    return;
  }

  if (
    [
      "service",
      "recipientName",
      "date",
      "time",
      "address",
      "duration",
    ].includes(field)
  ) {
    refreshBookingSummary();
  }
}

function handleBookingSubmit(event) {
  event.preventDefault();
  const step = state.booking.step;
  const errors = validateBookingStep(step, state.booking, today);
  if (step === 3) {
    const ack = document.querySelector("#review-ack");
    if (!ack.checked) {
      errors.review = "Confirm that you understand this is a demo request.";
    }
  }
  if (Object.keys(errors).length) {
    document.querySelector("#booking-errors").innerHTML = `<div class="callout warning" role="alert"><p>${escapeHTML(Object.values(errors)[0])}</p></div>`;
    return;
  }
  if (step < 3) {
    renderBooking(step + 1);
    location.hash = `#/book/${step + 1}`;
    return;
  }

  const caregiver = caregiverById(state.booking.caregiverId);
  const requestId = `demo-${Date.now()}`;
  state.booking.requestId = requestId;
  state.builtRequest = {
    id: requestId,
    service: state.booking.service,
    date: state.booking.date,
    time: state.booking.time,
    duration: state.booking.duration,
    recipient:
      state.booking.forWho === "someone"
        ? state.booking.recipientName
        : "Marleen de Boer",
    caregiver: caregiver.name,
    total: bookingPrice(caregiver.rate, state.booking.duration),
  };
  state.bookedRequests.unshift({
    ...state.builtRequest,
    status: "pending",
  });
  state.visitStatus = "pending";
  state.booking.confirmed = true;
  location.hash = "#/book/success";
}

function renderBookingSuccess() {
  if (!state.booking.confirmed || !state.builtRequest) {
    renderBooking(1);
    return;
  }
  const request = state.builtRequest;
  main.innerHTML = `
    <section class="section">
      <div class="narrow card success-panel">
        ${icon("check", "success-icon")}
        <span class="eyebrow">Demo request only</span>
        <h1>Your request has been sent.</h1>
        <p>${escapeHTML(request.caregiver)} has been matched to an illustrative ${escapeHTML(serviceLabel(request.service).toLowerCase())} visit. No real booking, message, payment or caregiver allocation has taken place.</p>
        <div class="summary-row"><span>When</span><strong>${formatDate(request.date, { year: true })} · ${escapeHTML(request.time)}</strong></div>
        <div class="summary-row"><span>Length</span><strong>${request.duration} minutes</strong></div>
        <div class="summary-row"><span>Total shown</span><strong>${money(request.total)}</strong></div>
        <div class="page-actions" style="justify-content: center">
          <a class="button" href="#/visits">View demo visits</a>
          <a class="button button-outline" href="#/discover">Explore caregivers</a>
        </div>
      </div>
    </section>
  `;
  requestAnimationFrame(() => {
    main.querySelector(".success-icon")?.setAttribute("data-animate", "true");
  });
}

function renderFamilyOnboarding() {
  if (state.family.submitted) {
    renderOnboardingSuccess("family");
    return;
  }
  const step = state.family.step;
  const errors = state.family.errors;
  let content = "";
  if (step === 1) {
    content = `
      <div class="form-section">
        <h2 id="onboarding-step-heading" tabindex="-1">Who do you hope to support?</h2>
        <p>Choose the closest option. This demo does not create a family account or save sensitive profiles.</p>
        <div class="choice-grid">
          ${[
            ["parent", "A parent", "Help arranged with their agreement"],
            ["partner", "A partner", "Support for everyday moments"],
            ["myself", "Myself", "Set preferences for your own care"],
            ["other", "Someone else", "A relative, neighbour or friend"],
          ]
            .map(
              ([value, title, detail]) => `
                <label class="choice-card">
                  <input type="radio" name="relationship" data-family-field="relationship" value="${value}" ${state.family.relationship === value ? "checked" : ""} aria-invalid="${Boolean(errors.relationship)}" ${errors.relationship ? 'aria-describedby="family-relationship-error"' : ""}>
                  <div class="choice-copy"><strong>${title}</strong><span>${detail}</span></div>
                </label>
              `,
            )
            .join("")}
        </div>
        ${errorFor(errors, "relationship", "family-relationship-error")}
      </div>
      <fieldset class="form-section" style="border:0;padding-inline:0" aria-labelledby="family-services-heading" aria-invalid="${Boolean(errors.services)}" ${errors.services ? 'aria-describedby="family-services-error"' : ""}>
        <legend class="sr-only">What kind of help feels useful?</legend>
        <h2 id="family-services-heading">What kind of help feels useful?</h2>
        <p>Select every service you may want to discuss later.</p>
        <div class="choice-grid">
          ${services
            .filter((service) => !service.unavailable)
            .map(
              (service) => `
                <label class="choice-card">
                  <input type="checkbox" data-family-service="${service.id}" ${state.family.services.includes(service.id) ? "checked" : ""} aria-invalid="${Boolean(errors.services)}" ${errors.services ? 'aria-describedby="family-services-error"' : ""}>
                  ${icon(service.icon)}
                  <div class="choice-copy"><strong>${escapeHTML(service.name)}</strong><span>${escapeHTML(service.short)}</span></div>
                </label>
              `,
            )
            .join("")}
        </div>
        ${errorFor(errors, "services", "family-services-error")}
      </fieldset>
      <div class="wizard-actions">
        <a class="button button-outline" href="#/">Cancel</a>
        <button class="button" type="submit">Continue</button>
      </div>
    `;
  } else if (step === 2) {
    content = `
      <div class="form-section">
        <h2 id="onboarding-step-heading" tabindex="-1">Preferences and consent</h2>
        <p>Keep preferences simple in this demo. No contact details are sent anywhere.</p>
        <div class="field-grid">
          <div class="field">
            <label for="family-name">Your first name</label>
            <input class="input" id="family-name" autocomplete="given-name" data-family-field="contactName" value="${escapeHTML(state.family.contactName)}">
          </div>
          <div class="field">
            <label for="family-email">Email <span class="muted">(demo only)</span></label>
            <input class="input" id="family-email" type="email" autocomplete="email" data-family-field="contactEmail" value="${escapeHTML(state.family.contactEmail)}">
          </div>
          <div class="field span-full">
            <label for="family-language">Preferred language</label>
            <select class="select" id="family-language" data-family-field="language" aria-invalid="${Boolean(errors.language)}" ${errors.language ? 'aria-describedby="family-language-error"' : ""}>
              <option value="">Choose a language</option>
              ${["Dutch", "English", "German", "Arabic"].map((language) => `<option ${state.family.language === language ? "selected" : ""}>${language}</option>`).join("")}
            </select>
            ${errorFor(errors, "language", "family-language-error")}
          </div>
        </div>
      </div>
      <div class="form-section">
        <h2>Consent comes first</h2>
        <label class="check-control">
          <input type="checkbox" data-family-field="consent" ${state.family.consent ? "checked" : ""} aria-invalid="${Boolean(errors.consent)}" ${errors.consent ? 'aria-describedby="family-consent-error"' : ""}>
          <span>I understand that the person receiving care or their authorised representative must agree before family access or shared visit information is enabled.</span>
        </label>
        ${errorFor(errors, "consent", "family-consent-error")}
      </div>
      <div class="wizard-actions">
        <button class="button button-outline" type="button" data-wizard-back>Back</button>
        <button class="button" type="submit">Review preferences</button>
      </div>
    `;
  } else {
    content = `
      <div class="form-section">
        <h2 id="onboarding-step-heading" tabindex="-1">Review</h2>
        <p>This is a demo setup. Nothing here creates a real account.</p>
        <div class="summary-row"><span>Supporting</span><strong>${escapeHTML(state.family.relationship)}</strong></div>
        <div class="summary-row"><span>Services</span><strong>${escapeHTML(state.family.services.map(serviceLabel).join(", "))}</strong></div>
        <div class="summary-row"><span>Language</span><strong>${escapeHTML(state.family.language)}</strong></div>
        <div class="summary-row"><span>Contact</span><strong>${escapeHTML(state.family.contactName || "Not provided")}</strong></div>
      </div>
      <div class="callout success"><p><strong>Your choices are ready.</strong> Finishing creates a friendly demo confirmation only.</p></div>
      <div class="wizard-actions">
        <button class="button button-outline" type="button" data-wizard-back>Back</button>
        <button class="button" type="submit">Finish demo setup</button>
      </div>
    `;
  }

  main.innerHTML = onboardingShell(
    "Create your care preferences",
    "A calm first step for family and seeker preferences.",
    step,
    ["Who and what", "Preferences", "Review"],
    content,
    "family",
    errors,
  );
  attachFamilyEvents();
}

function renderCaregiverOnboarding() {
  if (state.caregiver.submitted) {
    renderOnboardingSuccess("caregiver");
    return;
  }
  const step = state.caregiver.step;
  const errors = state.caregiver.errors;
  let content = "";
  if (step === 1) {
    content = `
      <div class="form-section">
        <h2 id="onboarding-step-heading" tabindex="-1">Your background</h2>
        <p>A short summary is enough for this fictional application.</p>
        <div class="field">
          <label for="caregiver-experience">Experience</label>
          <textarea class="textarea" id="caregiver-experience" data-caregiver-field="experience" aria-invalid="${Boolean(errors.experience)}" ${errors.experience ? 'aria-describedby="caregiver-experience-error"' : ""} placeholder="Tell us about the kind of support you have provided.">${escapeHTML(state.caregiver.experience)}</textarea>
          ${errorFor(errors, "experience", "caregiver-experience-error")}
        </div>
      </div>
      <fieldset class="form-section" style="border:0;padding-inline:0" aria-labelledby="caregiver-languages-heading" aria-invalid="${Boolean(errors.languages)}" ${errors.languages ? 'aria-describedby="caregiver-languages-error"' : ""}>
        <legend class="sr-only">Languages</legend>
        <h2 id="caregiver-languages-heading">Languages</h2>
        <div class="choice-grid">
          ${["Dutch", "English", "German", "Arabic"]
            .map((language) => `<label class="choice-card"><input type="checkbox" data-caregiver-language="${language}" ${state.caregiver.languages.includes(language) ? "checked" : ""} aria-invalid="${Boolean(errors.languages)}" ${errors.languages ? 'aria-describedby="caregiver-languages-error"' : ""}><div class="choice-copy"><strong>${language}</strong><span>Spoken with confidence</span></div></label>`)
            .join("")}
        </div>
        ${errorFor(errors, "languages", "caregiver-languages-error")}
      </fieldset>
      <div class="wizard-actions">
        <a class="button button-outline" href="#/">Cancel</a>
        <button class="button" type="submit">Continue</button>
      </div>
    `;
  } else if (step === 2) {
    content = `
      <div class="form-section">
        <h2 id="onboarding-step-heading" tabindex="-1">Where can you help?</h2>
        <div class="field">
          <label for="caregiver-area">Main Amsterdam area</label>
          <select class="select" id="caregiver-area" data-caregiver-field="neighborhood" aria-invalid="${Boolean(errors.neighborhood)}" ${errors.neighborhood ? 'aria-describedby="caregiver-area-error"' : ""}>
            <option value="">Choose an area</option>
            ${["Oud-West", "Oost", "Zuid", "Noord"]
              .map((area) => `<option ${state.caregiver.neighborhood === area ? "selected" : ""}>${area}</option>`)
              .join("")}
          </select>
          ${errorFor(errors, "neighborhood", "caregiver-area-error")}
        </div>
      </div>
      <fieldset class="form-section" style="border:0;padding-inline:0" aria-labelledby="caregiver-services-heading" aria-invalid="${Boolean(errors.services)}" ${errors.services ? 'aria-describedby="caregiver-services-error"' : ""}>
        <legend class="sr-only">Services</legend>
        <h2 id="caregiver-services-heading">Services</h2>
        <div class="choice-grid">
          ${services
            .filter((service) => !service.unavailable)
            .map((service) => `<label class="choice-card"><input type="checkbox" data-caregiver-service="${service.id}" ${state.caregiver.services.includes(service.id) ? "checked" : ""} aria-invalid="${Boolean(errors.services)}" ${errors.services ? 'aria-describedby="caregiver-services-error"' : ""}>${icon(service.icon)}<div class="choice-copy"><strong>${escapeHTML(service.name)}</strong><span>${escapeHTML(service.short)}</span></div></label>`)
            .join("")}
        </div>
        ${errorFor(errors, "services", "caregiver-services-error")}
      </fieldset>
      <fieldset class="form-section" style="border:0;padding-inline:0" aria-labelledby="caregiver-availability-heading" aria-invalid="${Boolean(errors.availability)}" ${errors.availability ? 'aria-describedby="caregiver-availability-error"' : ""}>
        <legend class="sr-only">Availability</legend>
        <h2 id="caregiver-availability-heading">Availability</h2>
        <div class="choice-grid">
          ${["Weekday mornings", "Weekday afternoons", "Evenings", "Weekends"]
            .map((slot) => `<label class="choice-card"><input type="checkbox" data-caregiver-availability="${slot}" ${state.caregiver.availability.includes(slot) ? "checked" : ""} aria-invalid="${Boolean(errors.availability)}" ${errors.availability ? 'aria-describedby="caregiver-availability-error"' : ""}><div class="choice-copy"><strong>${slot}</strong><span>Illustrative availability</span></div></label>`)
            .join("")}
        </div>
        ${errorFor(errors, "availability", "caregiver-availability-error")}
      </fieldset>
      <div class="wizard-actions">
        <button class="button button-outline" type="button" data-wizard-back>Back</button>
        <button class="button" type="submit">Review application</button>
      </div>
    `;
  } else {
    content = `
      <div class="form-section">
        <h2 id="onboarding-step-heading" tabindex="-1">Review your application</h2>
        <div class="summary-row"><span>Experience</span><strong>${escapeHTML(state.caregiver.experience)}</strong></div>
        <div class="summary-row"><span>Languages</span><strong>${escapeHTML(state.caregiver.languages.join(", "))}</strong></div>
        <div class="summary-row"><span>Area</span><strong>${escapeHTML(state.caregiver.neighborhood)}</strong></div>
        <div class="summary-row"><span>Services</span><strong>${escapeHTML(state.caregiver.services.map(serviceLabel).join(", "))}</strong></div>
        <div class="summary-row"><span>Availability</span><strong>${escapeHTML(state.caregiver.availability.join(", "))}</strong></div>
      </div>
      <div class="callout warning"><p><strong>Pending checks:</strong> submitting this demo application does not verify your identity, references or qualifications.</p></div>
      <div class="wizard-actions">
        <button class="button button-outline" type="button" data-wizard-back>Back</button>
        <button class="button" type="submit">Submit demo application</button>
      </div>
    `;
  }

  main.innerHTML = onboardingShell(
    "Apply to care nearby",
    "Share your background, area and the support you enjoy.",
    step,
    ["Background", "Area and hours", "Review"],
    content,
    "caregiver",
    errors,
  );
  attachCaregiverOnboardingEvents();
}

function onboardingErrorSummary(errors) {
  const messages = Object.values(errors);
  if (!messages.length) return "";
  return `
    <div class="callout warning onboarding-error-summary" role="alert">
      <p><strong>Please check the highlighted fields.</strong></p>
      <ul>${messages.map((message) => `<li>${escapeHTML(message)}</li>`).join("")}</ul>
    </div>
  `;
}

function onboardingShell(title, lede, step, labels, content, kind, errors) {
  return `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">${kind === "family" ? "Family and seeker setup" : "Caregiver application"}</span>
        <h1>${escapeHTML(title)}</h1>
        <p class="lede">${escapeHTML(lede)}</p>
        ${renderProgress(step, labels)}
      </div>
    </section>
    <section class="section-tight">
      <div class="container wizard-layout">
        <form class="wizard-main card" id="onboarding-form" novalidate>
          <div id="onboarding-errors" aria-live="polite" tabindex="-1">${onboardingErrorSummary(errors)}</div>
          ${content}
        </form>
        <aside class="summary-card card">
          <h2>${kind === "family" ? "Designed around trust" : "What happens next"}</h2>
          <p class="muted micro">${kind === "family" ? "Preferences stay in your browser state. Consent is required before family access is described as possible." : "A submitted application is pending checks. It never becomes a verified provider profile automatically."}</p>
          <div class="checks">
            <span class="check-pill">${icon("lock")} Private local state</span>
            <span class="check-pill">${icon("info")} Demo only</span>
          </div>
          <div class="sidebar-note">${kind === "family" ? "You can move between steps and your choices will be preserved." : "All examples, checks and availability are fictional."}</div>
        </aside>
      </div>
    </section>
  `;
}

function attachFamilyEvents() {
  const form = document.querySelector("#onboarding-form");
  form.addEventListener("change", (event) => {
    const field = event.target.dataset.familyField;
    if (field) {
      state.family[field] =
        event.target.type === "checkbox" ? event.target.checked : event.target.value;
    }
    if (event.target.dataset.familyService) {
      toggleArrayValue(
        state.family.services,
        event.target.dataset.familyService,
        event.target.checked,
      );
    }
  });
  form.addEventListener("input", (event) => {
    const field = event.target.dataset.familyField;
    if (field && event.target.type !== "checkbox") {
      state.family[field] = event.target.value;
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const step = state.family.step;
    const errors = validateOnboardingStep("family", step, state.family);
    state.family.errors = errors;
    if (Object.keys(errors).length) {
      renderFamilyOnboarding();
      focusAfterRender("#onboarding-errors");
      return;
    }
    if (step < 3) {
      state.family.step += 1;
      renderFamilyOnboarding();
      focusAfterRender("#onboarding-step-heading");
    } else {
      state.family.submitted = true;
      renderFamilyOnboarding();
      focusAfterRender("#onboarding-success-heading");
    }
  });
  form.querySelector("[data-wizard-back]")?.addEventListener("click", () => {
    state.family.step = Math.max(1, state.family.step - 1);
    state.family.errors = {};
    renderFamilyOnboarding();
    focusAfterRender("#onboarding-step-heading");
  });
}

function attachCaregiverOnboardingEvents() {
  const form = document.querySelector("#onboarding-form");
  form.addEventListener("change", (event) => {
    const field = event.target.dataset.caregiverField;
    if (field) state.caregiver[field] = event.target.value;
    if (event.target.dataset.caregiverLanguage) {
      toggleArrayValue(
        state.caregiver.languages,
        event.target.dataset.caregiverLanguage,
        event.target.checked,
      );
    }
    if (event.target.dataset.caregiverService) {
      toggleArrayValue(
        state.caregiver.services,
        event.target.dataset.caregiverService,
        event.target.checked,
      );
    }
    if (event.target.dataset.caregiverAvailability) {
      toggleArrayValue(
        state.caregiver.availability,
        event.target.dataset.caregiverAvailability,
        event.target.checked,
      );
    }
  });
  form.addEventListener("input", (event) => {
    const field = event.target.dataset.caregiverField;
    if (field) state.caregiver[field] = event.target.value;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const step = state.caregiver.step;
    const errors = validateOnboardingStep("caregiver", step, state.caregiver);
    state.caregiver.errors = errors;
    if (Object.keys(errors).length) {
      renderCaregiverOnboarding();
      focusAfterRender("#onboarding-errors");
      return;
    }
    if (step < 3) {
      state.caregiver.step += 1;
      renderCaregiverOnboarding();
      focusAfterRender("#onboarding-step-heading");
    } else {
      state.caregiver.submitted = true;
      renderCaregiverOnboarding();
      focusAfterRender("#onboarding-success-heading");
    }
  });
  form.querySelector("[data-wizard-back]")?.addEventListener("click", () => {
    state.caregiver.step = Math.max(1, state.caregiver.step - 1);
    state.caregiver.errors = {};
    renderCaregiverOnboarding();
    focusAfterRender("#onboarding-step-heading");
  });
}

function toggleArrayValue(array, value, checked) {
  const index = array.indexOf(value);
  if (checked && index === -1) array.push(value);
  if (!checked && index >= 0) array.splice(index, 1);
}

function renderOnboardingSuccess(kind) {
  const family = kind === "family";
  main.innerHTML = `
    <section class="section">
      <div class="narrow card success-panel">
        ${icon("check", "success-icon")}
        <span class="eyebrow">${family ? "Demo preferences ready" : "Application pending checks"}</span>
        <h1 id="onboarding-success-heading" tabindex="-1">${family ? "A thoughtful start." : "Your demo application is in."}</h1>
        <p>${family ? "Your choices are kept only in this local page session. No account, invitation or family access has been created." : "This fictional application has not been verified. A production team would next review identity, references and any service requirements before enabling bookings."}</p>
        <div class="page-actions" style="justify-content:center">
          <a class="button" href="${family ? "#/discover" : "#/requests"}">${family ? "Find care nearby" : "View caregiver area"}</a>
          <a class="button button-outline" href="#/">Return home</a>
        </div>
      </div>
    </section>
  `;
  requestAnimationFrame(() => {
    main.querySelector(".success-icon")?.setAttribute("data-animate", "true");
  });
}

function lifecycleEntry(status) {
  const normalized = normalizeVisitStatus(status);
  return (
    visitLifecycle.find((item) => item.status === normalized) ||
    visitLifecycle[0]
  );
}

function recipientStatusCopy(status) {
  const copy = {
    pending:
      "Your family has asked a caregiver about this visit. You do not need to do anything while it is pending.",
    confirmed:
      "A caregiver and visit time have been confirmed in this preview. Your family can see the same status.",
    in_progress:
      "Your caregiver has arrived. The visit is underway, and your family can see this update.",
    completed:
      "Your visit is complete. You and your family can review the summary below.",
  };
  return copy[normalizeVisitStatus(status)];
}

function renderVisits() {
  const ana = caregiverById("ana");
  const currentRequest = state.bookedRequests[0];
  const currentStatus = normalizeVisitStatus(state.visitStatus);
  const currentState = lifecycleEntry(currentStatus);
  const recipientView = state.visitView === "recipient";
  const statusButtons = visitLifecycle
    .map(
      (item) => `
        <button class="lifecycle-status-button ${item.status === currentStatus ? "active" : ""}" type="button" data-visit-status="${item.status}" aria-pressed="${item.status === currentStatus}">
          <span class="status-dot ${item.status}" aria-hidden="true"></span>
          ${escapeHTML(item.label)}
        </button>
      `,
    )
    .join("");
  const requestContext = currentRequest
    ? `${escapeHTML(currentRequest.caregiver)} · ${formatDate(currentRequest.date)} · ${escapeHTML(currentRequest.time)}`
    : `${escapeHTML(ana.name)} · ${formatDate("2026-10-28")} · 09:30`;

  main.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Visit history</span>
        <h1>What is happening, plainly.</h1>
        <p class="lede">Follow a sample visit from pending to completed, or switch to the larger-text view designed for the person receiving care.</p>
        <div class="page-actions">
          <button class="button" type="button" data-open-contact>${icon("phone")} ${state.contact.phone ? "Call your contact" : "Set up a call contact"}</button>
          <a class="text-action" href="#/book/1">Request another visit ${icon("arrowRight")}</a>
        </div>
      </div>
    </section>

    <section class="section-tight">
      <div class="container">
        <div class="visit-view-head">
          <div class="segmented" role="group" aria-label="Choose visit view">
            <button type="button" data-visit-view="family" aria-pressed="${!recipientView}">Family view</button>
            <button type="button" data-visit-view="recipient" aria-pressed="${recipientView}">For the person receiving care</button>
          </div>
        </div>
        <div class="lifecycle-tabs" aria-label="Preview visit statuses">
          ${statusButtons}
        </div>
        <div class="lifecycle-progress" aria-label="Visit progress">
          ${visitLifecycle
            .map(
              (item) => `
                <span class="${item.status === currentStatus ? "active" : visitLifecycle.indexOf(item) < visitLifecycle.indexOf(currentState) ? "done" : ""}">
                  ${escapeHTML(item.label)}
                </span>
              `,
            )
            .join("")}
        </div>
        <article class="lifecycle-panel card${recipientView ? " recipient-view" : ""}" aria-live="polite">
          <div class="lifecycle-panel-head">
            <div>
              <span class="visit-kicker">${recipientView ? "Your visit" : "Current demo request"}</span>
              <h2>${escapeHTML(currentState.label)}</h2>
              <p class="visit-context">${requestContext}</p>
            </div>
            <span class="status ${currentStatus}">${escapeHTML(currentState.label)}</span>
          </div>
          <p class="lifecycle-message">${escapeHTML(recipientView ? recipientStatusCopy(currentStatus) : currentState.message)}</p>
          <div class="next-action">
            ${icon("arrowRight")}
            <p>${escapeHTML(currentState.nextAction)}</p>
          </div>
          <div class="lifecycle-detail-grid">
            <div>
              <h3>Timeline</h3>
              <ol class="timeline">
                ${currentState.timeline.map(([label, time]) => `<li><strong>${escapeHTML(label)}</strong><span>${escapeHTML(time)}</span></li>`).join("")}
              </ol>
            </div>
            <div>
              <h3>${recipientView ? "Who can see this" : "Local preview control"}</h3>
              <p>${recipientView ? "Your family sees the same sample status. You choose what a future production service could share." : "Status changes happen only when you activate the control below. This demo cannot dispatch a caregiver or take payment."}</p>
              <div class="page-actions">
                <button class="button${currentStatus === "completed" ? "" : ""}" type="button" data-visit-next ${currentStatus === "completed" ? "disabled" : ""}>${currentStatus === "completed" ? "Lifecycle complete" : "Simulate next status"}</button>
                <button class="button button-ghost" type="button" data-visit-reset>Reset to pending</button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="section-tight section-rule">
      <div class="container visit-layout">
        <article class="visit-main card">
          <span class="visit-kicker">Completed demo visit</span>
          <h2 class="visit-detail-heading">Appointment support with ${escapeHTML(ana.name)}</h2>
          <p class="muted">${formatDate(pastVisit.date, { year: true })} · ${escapeHTML(pastVisit.recipient)}</p>
          <div class="visit-section">
            <h2>What was done</h2>
            <ul class="visit-list">${pastVisit.tasks.map((task) => `<li>${escapeHTML(task)}</li>`).join("")}</ul>
          </div>
          <div class="visit-section">
            <h2>Observations</h2>
            <p>${escapeHTML(pastVisit.observations)}</p>
          </div>
          <div class="visit-section">
            <h2>Follow-up</h2>
            <p>${escapeHTML(pastVisit.followUp)}</p>
            <a class="button button-outline button-small" href="#/book/1" data-rebook-ana>${icon("repeat")} Rebook Sanne</a>
          </div>
        </article>
        <aside class="summary-card card">
          <h2>Receipt</h2>
          <div class="receipt-total">${money(pastVisit.total)}</div>
          <p class="muted">Paid in this illustrative completed record. Transport was paid separately.</p>
          <button class="button button-outline button-small" type="button" id="download-receipt">${icon("download")} Download receipt</button>
        </aside>
      </div>
    </section>
  `;

  main.querySelectorAll("[data-visit-status]").forEach((button) => {
    button.addEventListener("click", () => {
      state.visitStatus = normalizeVisitStatus(button.dataset.visitStatus);
      if (state.bookedRequests[0]) {
        state.bookedRequests[0].status = state.visitStatus;
      }
      renderVisits();
      focusAfterRender(`[data-visit-status="${state.visitStatus}"]`);
    });
  });
  main.querySelectorAll("[data-visit-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.visitView = button.dataset.visitView;
      renderVisits();
      focusAfterRender(`[data-visit-view="${state.visitView}"]`);
    });
  });
  main.querySelector("[data-visit-next]").addEventListener("click", () => {
    state.visitStatus = nextVisitStatus(state.visitStatus);
    if (state.bookedRequests[0]) {
      state.bookedRequests[0].status = state.visitStatus;
    }
    renderVisits();
    showToast(`Demo visit moved to ${lifecycleEntry(state.visitStatus).label.toLowerCase()}.`);
  });
  main.querySelector("[data-visit-reset]").addEventListener("click", () => {
    state.visitStatus = "pending";
    if (state.bookedRequests[0]) state.bookedRequests[0].status = "pending";
    renderVisits();
    showToast("Demo visit reset to pending.");
  });
  document.querySelector("#download-receipt").addEventListener("click", () => {
    const blob = new Blob([receiptText(pastVisit, ana)], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "carenear-demo-receipt.txt";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    showToast("Demo receipt downloaded.");
  });
  document.querySelector("[data-rebook-ana]").addEventListener("click", () => {
    state.booking = createBooking({
      caregiverId: "ana",
      service: "appointment",
      duration: 90,
    });
  });
}

function renderRequests() {
  const selected =
    state.requests.find((request) => request.id === state.selectedRequestId) ||
    state.requests[0];
  const caregiver = caregiverById("ana");
  const earned = selected
    ? (caregiver.rate * selected.duration) / 60
    : 0;
  main.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Caregiver area</span>
        <h1>Requests that fit your day.</h1>
        <p class="lede">Respond within the illustrative window. Accepting or declining updates this local demo immediately; no family or caregiver is contacted.</p>
      </div>
    </section>
    <section class="section-tight">
      <div class="container visit-layout">
        <div>
          <div class="results-header">
            <p><strong>${state.requests.length}</strong> sample requests</p>
            <button class="button button-small button-ghost" type="button" id="reset-requests">Reset demo states</button>
          </div>
          <div class="request-list">
            ${state.requests
              .map(
                (request) => `
                  <button class="request-row" type="button" data-request="${request.id}" aria-pressed="${request.id === selected.id}">
                    <span>
                      <h2>${escapeHTML(serviceLabel(request.service))}</h2>
                      <p>${formatDate(request.date)} · ${escapeHTML(request.time)} · ${request.duration} min · ${escapeHTML(request.neighborhood)}</p>
                    </span>
                    <span class="status ${request.status}">${requestStatusLabel(request.status, request.replyWindow)}</span>
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
        <aside class="request-detail card" aria-live="polite">
          <div class="breadcrumb"><span>Selected request</span></div>
          <h2>${escapeHTML(serviceLabel(selected.service))}</h2>
          <p class="muted">For ${escapeHTML(selected.recipient)}</p>
          <dl class="request-facts">
            <div><dt>Date</dt><dd>${formatDate(selected.date, { year: true })}</dd></div>
            <div><dt>Time</dt><dd>${escapeHTML(selected.time)} · ${selected.duration} minutes</dd></div>
            <div><dt>Language</dt><dd>${escapeHTML(selected.language)}</dd></div>
          </dl>
          <div class="request-earnings"><span>You would earn</span><strong>${money(earned)} <small>+ ${money(4)} travel</small></strong></div>
          <section class="request-note">
            <h3>Accessibility</h3>
            <p>${escapeHTML(selected.accessibility)}</p>
          </section>
          <section class="request-note">
            <h3>Visit instructions</h3>
            <p>${escapeHTML(selected.instructions)}</p>
          </section>
          <div class="request-actions">
            <button class="button" type="button" data-request-action="accepted" ${selected.status !== "new" ? "disabled" : ""}>${icon("check")} Accept request</button>
            <button class="button button-danger" type="button" data-request-action="declined" ${selected.status !== "new" ? "disabled" : ""}>Decline</button>
          </div>
          ${
            selected.status !== "new"
              ? `<div class="callout" style="margin-top:20px"><p><strong>${selected.status === "accepted" ? "Accepted locally." : "Declined locally."}</strong> No message was sent.</p></div>`
              : ""
          }
        </aside>
      </div>
    </section>
  `;
  main.querySelectorAll("[data-request]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRequestId = button.dataset.request;
      renderRequests();
      focusAfterRender(`[data-request="${state.selectedRequestId}"]`);
    });
  });
  main.querySelectorAll("[data-request-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const request = state.requests.find(
        (item) => item.id === state.selectedRequestId,
      );
      request.status = button.dataset.requestAction;
      renderRequests();
      showToast(
        request.status === "accepted"
          ? "Request accepted in this demo."
          : "Request declined in this demo.",
      );
    });
  });
  document.querySelector("#reset-requests").addEventListener("click", () => {
    state.requests = sampleRequests.map((request) => ({ ...request }));
    state.selectedRequestId = state.requests[0].id;
    renderRequests();
    showToast("Sample request states reset.");
  });
}

function requestStatusLabel(status, replyWindow) {
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  return `Reply in ${replyWindow}`;
}

function renderNotFound() {
  main.innerHTML = `
    <section class="not-found">
      <div>
        <span class="eyebrow">Page not found</span>
        <h1>This path is not nearby.</h1>
        <a class="button" href="#/">Return to CareNear</a>
      </div>
    </section>
  `;
}

function route() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const rawPath = decodeURIComponent(raw.split("?")[0]);
  const anchor = rawPath.split("#")[1] || "";
  const path = rawPath.split("#")[0];
  const pageTitles = {
    "/": "Thoughtful care. Close to home.",
    "/discover": "Find care in Amsterdam",
    "/book/1": "Book a visit · Step 1",
    "/book/2": "Book a visit · Step 2",
    "/book/3": "Book a visit · Step 3",
    "/book/success": "Demo request sent",
    "/family-onboarding": "Family preferences",
    "/caregiver-onboarding": "Caregiver application",
    "/visits": "Visit summaries",
    "/requests": "Caregiver requests",
  };
  document.title = `${pageTitles[path] || "Page not found"} | CareNear`;
  renderFooter();

  if (path === "/") renderLanding();
  else if (path === "/discover") renderDiscover();
  else if (path === "/book/1") renderBooking(1);
  else if (path === "/book/2") renderBooking(2);
  else if (path === "/book/3") renderBooking(3);
  else if (path === "/book/success") renderBookingSuccess();
  else if (path === "/family-onboarding") renderFamilyOnboarding();
  else if (path === "/caregiver-onboarding") renderCaregiverOnboarding();
  else if (path === "/visits") renderVisits();
  else if (path === "/requests") renderRequests();
  else renderNotFound();

  setActiveNavigation(path);
  window.scrollTo({ top: 0, behavior: "instant" });
  if (anchor === "how-it-works") {
    requestAnimationFrame(() => {
      document
        .querySelector("#how-it-works")
        ?.scrollIntoView({ block: "start" });
    });
  }
  if (renderFocusSelector) {
    const selector = renderFocusSelector;
    renderFocusSelector = "";
    focusAfterRender(selector);
  }
}

menuToggle.addEventListener("click", () => {
  const open = primaryNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", open);
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

document.addEventListener("click", (event) => {
  const contactTrigger = event.target.closest("[data-open-contact]");
  if (contactTrigger) openContactDialog();
});

window.addEventListener("hashchange", route);
renderFooter();
route();
