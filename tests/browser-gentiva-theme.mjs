import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(
  "/Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/",
);
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5183";
const qaDirectory = "docs/agent-work/carenear-demo/QA/gentiva-theme";
const requiredPalette = {
  "--canvas": "#f8f5ef",
  "--surface": "#fffefa",
  "--ink": "#171a1d",
  "--muted": "#565d59",
  "--primary-action": "#111416",
  "--butter": "#f2e58c",
  "--butter-soft": "#fbf7d7",
  "--sage": "#b7c6a5",
  "--sage-soft": "#edf2e7",
  "--warm-neutral": "#f0ece3",
  "--line": "#dad8d0",
  "--control-boundary": "#7f8780",
};

function parseRgb(value) {
  const match = value.match(/rgba?\(([^)]+)\)/);
  assert.ok(match, `Expected rgb colour, received ${value}`);
  return match[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => Number(channel.trim()) / 255);
}

function luminance(rgb) {
  const linear = rgb.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const values = [luminance(parseRgb(foreground)), luminance(parseRgb(background))];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

async function waitForImages(page, selector) {
  await page.waitForFunction(
    (imageSelector) => {
      const images = [...document.querySelectorAll(imageSelector)];
      return (
        images.length > 0 &&
        images.every((image) => image.complete && image.naturalWidth > 0)
      );
    },
    selector,
  );
}

async function assertSelectorsAtLeast16(page, selectors, context) {
  const sizes = await page.evaluate((requested) => {
    return Object.fromEntries(
      requested.map((selector) => [
        selector,
        [...document.querySelectorAll(selector)].map((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        ),
      ]),
    );
  }, selectors);
  for (const [selector, values] of Object.entries(sizes)) {
    assert.ok(values.length > 0, `${context}: ${selector} did not match`);
    assert.ok(
      values.every((value) => value >= 16),
      `${context}: ${selector} rendered below 16px (${values.join(", ")})`,
    );
  }
}

async function assertNoVisibleSmallText(page, context) {
  const violations = await page.evaluate(() => {
    return [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (element.closest(".sr-only")) return false;
        if (element.closest(".check-pill, .tag, .status")) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const directText = [...element.childNodes]
          .filter((node) => node.nodeType === 3)
          .map((node) => node.textContent.trim())
          .join(" ")
          .trim();
        return (
          directText &&
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number.parseFloat(style.fontSize) < 16
        );
      })
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: element.className?.baseVal ?? element.className,
        text: element.textContent.trim().slice(0, 80),
        fontSize: getComputedStyle(element).fontSize,
      }));
  });
  assert.deepEqual(violations, [], `${context} contains visible text below 16px`);
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await waitForImages(page, ".caregiver-rail .portrait img");
  const theme = await page.evaluate((palette) => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const heading = getComputedStyle(document.querySelector(".hero h1"));
    const resources = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name);
    return {
      palette: Object.fromEntries(
        Object.keys(palette).map((token) => [
          token,
          root.getPropertyValue(token).trim().toLowerCase(),
        ]),
      ),
      bodyFamily: body.fontFamily,
      bodySize: Number.parseFloat(body.fontSize),
      bodyLineHeight: Number.parseFloat(body.lineHeight),
      headingFamily: heading.fontFamily,
      headingWeight: heading.fontWeight,
      fontsLoaded: [
        document.fonts.check('600 42px "Playfair Display"'),
        document.fonts.check('400 17px "DM Sans"'),
      ],
      localFonts: resources.filter((url) => url.includes("/assets/fonts/")),
    };
  }, requiredPalette);
  assert.deepEqual(theme.palette, requiredPalette);
  assert.match(theme.bodyFamily, /DM Sans/);
  assert.ok(theme.bodySize >= 16);
  assert.ok(theme.bodyLineHeight / theme.bodySize >= 1.5);
  assert.match(theme.headingFamily, /Playfair Display/);
  assert.ok(["500", "600"].includes(theme.headingWeight));
  assert.deepEqual(theme.fontsLoaded, [true, true]);
  assert.ok(
    theme.localFonts.some((url) =>
      url.endsWith("Playfair-Display-SemiBold.ttf"),
    ),
  );
  assert.ok(
    theme.localFonts.some((url) =>
      url.endsWith("DM-Sans-Regular.ttf"),
    ),
  );

  const landing = await page.evaluate(() => {
    const heading = document.querySelector(".hero h1");
    const style = getComputedStyle(heading);
    const search = document.querySelector(".hero-search");
    const image = document.querySelector(".hero-media");
    const cards = [...document.querySelectorAll(".caregiver-rail .caregiver-card")];
    const footers = [
      ...document.querySelectorAll(".caregiver-rail .caregiver-card-footer"),
    ];
    return {
      headingSize: Number.parseFloat(style.fontSize),
      headingLines: Math.round(
        heading.getBoundingClientRect().height /
          Number.parseFloat(style.lineHeight),
      ),
      searchBottom: search.getBoundingClientRect().bottom,
      imageTop: image.getBoundingClientRect().top,
      primaryHeroActions: document.querySelectorAll(".hero .button").length,
      primaryButton: (() => {
        const style = getComputedStyle(document.querySelector(".hero .button"));
        return { color: style.color, background: style.backgroundColor };
      })(),
      cardStyle: (() => {
        const style = getComputedStyle(
          document.querySelector(".caregiver-card"),
        );
        return {
          background: style.backgroundColor,
          border: style.borderColor,
          radius: style.borderRadius,
          shadow: style.boxShadow,
        };
      })(),
      socialProof: document.querySelector(".social-proof")?.innerText,
      cardMediaRatios: cards.map((card) => {
        const box = card
          .querySelector(".caregiver-card-media")
          .getBoundingClientRect();
        return box.width / box.height;
      }),
      footerTops: footers.map((footer) =>
        Math.round(footer.getBoundingClientRect().top),
      ),
      decisionFontSizes: Object.fromEntries(
        [
          ".hero .lede",
          ".button",
          ".caregiver-meta",
          ".demo-note",
        ].map((selector) => [
          selector,
          Number.parseFloat(
            getComputedStyle(document.querySelector(selector)).fontSize,
          ),
        ]),
      ),
    };
  });
  assert.ok(landing.headingSize >= 50 && landing.headingSize <= 56);
  assert.equal(landing.headingLines, 2);
  assert.ok(landing.searchBottom < 900);
  assert.equal(landing.primaryHeroActions, 1);
  assert.equal(landing.primaryButton.background, "rgb(17, 20, 22)");
  assert.ok(
    contrastRatio(landing.primaryButton.color, landing.primaryButton.background) >=
      4.5,
  );
  assert.match(landing.cardStyle.border, /218, 216, 208/);
  assert.notEqual(landing.cardStyle.shadow, "none");
  assert.ok(Number.parseFloat(landing.cardStyle.radius) >= 8);
  assert.ok(Number.parseFloat(landing.cardStyle.radius) <= 14);
  assert.match(landing.socialProof, /1,240\s+sample visits/);
  assert.match(landing.socialProof, /4\.9 average/);
  assert.match(landing.socialProof, /2 h\s+sample reply time/);
  assert.ok(
    Math.max(...landing.cardMediaRatios) - Math.min(...landing.cardMediaRatios) <
      0.01,
  );
  assert.ok(
    Math.max(...landing.footerTops) - Math.min(...landing.footerTops) <= 1,
  );
  for (const selector of [".hero .lede", ".button", ".caregiver-meta"]) {
    assert.ok(
      landing.decisionFontSizes[selector] >= 16,
      `${selector} is below 16px`,
    );
  }
  await assertSelectorsAtLeast16(
    page,
    [
      ".demo-strip",
      ".eyebrow",
      ".hero-search label span",
      ".social-proof-intro span",
      ".proof-stat",
      ".step-number",
      ".step-item p",
      ".service-card .card-link",
      ".footer-brand .micro",
      ".footer-column h3",
      ".footer-column a",
      ".footer-bottom span",
    ],
    "landing desktop",
  );
  await assertNoVisibleSmallText(page, "landing desktop");
  await page.screenshot({
    path: `${qaDirectory}/landing-desktop-1440.png`,
    fullPage: false,
  });
  await page.screenshot({
    path: `${qaDirectory}/landing-full.png`,
    fullPage: true,
  });

  await page.locator(".caregiver-rail").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `${qaDirectory}/caregiver-cards.png`,
    fullPage: false,
  });

  await page.goto(`${baseUrl}/#/discover`, { waitUntil: "networkidle" });
  await waitForImages(page, ".caregiver-list .portrait img");
  await assertSelectorsAtLeast16(
    page,
    [
      ".segmented button",
      ".map-head p",
      ".map-label",
      ".map-pin",
      ".map-selection p",
    ],
    "discover desktop",
  );
  await assertNoVisibleSmallText(page, "discover desktop");
  assert.equal(
    await page.locator(".caregiver-list .caregiver-card").count(),
    4,
  );
  assert.equal(
    await page.locator(".caregiver-list .portrait img").evaluateAll((images) =>
      images.every((image) => image.complete && image.naturalWidth > 0),
    ),
    true,
  );
  await page.screenshot({
    path: `${qaDirectory}/discover-desktop.png`,
    fullPage: false,
  });

  await page.goto(`${baseUrl}/#/book/1`, { waitUntil: "networkidle" });
  await page
    .locator('input[data-booking-field="forWho"][value="someone"]')
    .check();
  await page.locator("#recipient-name").fill("Mara Kralj");
  await assertSelectorsAtLeast16(
    page,
    [
      ".progress li",
      ".breadcrumb",
      ".choice-copy span",
      ".check-control",
      ".field label",
    ],
    "booking step one",
  );
  await assertNoVisibleSmallText(page, "booking step one");
  assert.equal(
    await page.locator('input[data-booking-field="consent"]').isChecked(),
    false,
  );
  await page.getByRole("button", { name: "Continue" }).click();
  assert.match(await page.locator("#booking-errors").innerText(), /permission/);
  await page.locator('input[data-booking-field="consent"]').check();
  await page.getByRole("button", { name: "Continue" }).click();
  await assertSelectorsAtLeast16(
    page,
    [
      ".progress li",
      ".time-grid button",
      ".dow",
      ".calendar-day:not(:disabled)",
      ".helper",
    ],
    "booking step two",
  );
  await assertNoVisibleSmallText(page, "booking step two");
  await page.locator('[data-booking-time="09:30"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await assertSelectorsAtLeast16(
    page,
    [
      ".progress li",
      ".summary-row",
      ".sidebar-note",
      ".caregiver-option .caregiver-meta",
    ],
    "booking step three",
  );
  await assertNoVisibleSmallText(page, "booking step three");
  assert.match(await page.locator(".summary-card").innerText(), /€42/);
  await waitForImages(page, ".caregiver-option-list .portrait img");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `${qaDirectory}/booking-inner-desktop.png`,
    fullPage: false,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await waitForImages(page, ".caregiver-rail .portrait img");
  const mobile = await page.evaluate(() => {
    const heading = document.querySelector(".hero h1");
    const style = getComputedStyle(heading);
    return {
      headingLines: Math.round(
        heading.getBoundingClientRect().height /
          Number.parseFloat(style.lineHeight),
      ),
      searchBottom: document.querySelector(".hero-search").getBoundingClientRect()
        .bottom,
      imageTop: document.querySelector(".hero-media").getBoundingClientRect().top,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  const mobileHeadingSize = Number.parseFloat(
    await page
      .locator(".hero h1")
      .evaluate((element) => getComputedStyle(element).fontSize),
  );
  assert.ok(mobile.headingLines <= 3);
  assert.ok(mobileHeadingSize >= 39 && mobileHeadingSize <= 42);
  assert.ok(mobile.searchBottom < mobile.imageTop);
  assert.equal(mobile.scrollWidth, mobile.clientWidth);
  await page.screenshot({
    path: `${qaDirectory}/landing-mobile-390.png`,
    fullPage: false,
  });

  await page.goto(`${baseUrl}/#/discover`, { waitUntil: "networkidle" });
  const listPane = page.locator(".discover-pane").first();
  const mapPane = page.locator(".map-panel");
  assert.equal(await listPane.isVisible(), true);
  assert.equal(await mapPane.isVisible(), false);
  await page.getByRole("button", { name: "Map", exact: true }).click();
  assert.equal(await listPane.isVisible(), false);
  assert.equal(await mapPane.isVisible(), true);

  await page.goto(`${baseUrl}/#/book/2`, { waitUntil: "networkidle" });
  await page.locator("#visit-notes").scrollIntoViewIfNeeded();
  const sticky = await page.evaluate(() => {
    const summary = document
      .querySelector("#mobile-booking-summary")
      .getBoundingClientRect();
    return {
      top: summary.top,
      text: document.querySelector("#mobile-booking-summary").innerText,
      position: getComputedStyle(
        document.querySelector("#mobile-booking-summary"),
      ).position,
    };
  });
  assert.ok(sticky.position === "sticky");
  assert.match(sticky.text, /Ana Horvat/);
  assert.match(sticky.text, /Total/);
  await assertSelectorsAtLeast16(
    page,
    [
      ".mobile-summary-total span",
      ".mobile-contact-action",
      ".mobile-booking-summary summary",
      ".mobile-summary-details .summary-row",
      ".mobile-booking-summary .text-action",
    ],
    "mobile sticky summary",
  );
  await assertNoVisibleSmallText(page, "mobile booking");

  await page.goto(`${baseUrl}/#/visits`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "For the person receiving care" }).click();
  assert.ok(
    Number.parseFloat(
      await page
        .locator(".recipient-view .lifecycle-message")
        .evaluate((element) => getComputedStyle(element).fontSize),
    ) >= 18,
  );
  await assertSelectorsAtLeast16(
    page,
    [
      ".lifecycle-progress span",
      ".visit-kicker",
      ".timeline li",
      ".lifecycle-status-button",
    ],
    "visits",
  );
  await assertNoVisibleSmallText(page, "visits mobile");
  await page.getByRole("button", { name: "Set up a call contact" }).click();
  assert.equal(await page.locator("#app-dialog[open]").count(), 1);
  await page.locator(".dialog-close").click();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  const reducedMotion = await page.evaluate(() => ({
    buttonTransition: getComputedStyle(
      document.querySelector(".button"),
    ).transitionDuration,
    photoTransition: getComputedStyle(
      document.querySelector(".portrait img"),
    ).transitionDuration,
  }));
  assert.ok(["0.01ms", "1e-05s"].includes(reducedMotion.buttonTransition));
  assert.ok(["0.01ms", "1e-05s"].includes(reducedMotion.photoTransition));
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  const reflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    headingLines: Math.round(
      document.querySelector(".hero h1").getBoundingClientRect().height /
        Number.parseFloat(
          getComputedStyle(document.querySelector(".hero h1")).lineHeight,
        ),
    ),
    headingWidth: document.querySelector(".hero h1").getBoundingClientRect()
      .width,
    searchBottom: document.querySelector(".hero-search").getBoundingClientRect()
      .bottom,
    imageTop: document.querySelector(".hero-media").getBoundingClientRect().top,
    viewportWidth: innerWidth,
  }));
  assert.equal(reflow.scrollWidth, reflow.clientWidth);
  assert.ok(reflow.headingLines <= 3);
  assert.ok(reflow.searchBottom < reflow.imageTop);
  assert.ok(reflow.headingWidth <= reflow.viewportWidth - 32);
  await assertSelectorsAtLeast16(
    page,
    [".demo-strip", ".hero-search label span", ".progress, .step-number"],
    "320px landing",
  );
  await assertNoVisibleSmallText(page, "320px landing");
  await page.screenshot({
    path: `${qaDirectory}/reflow-320.png`,
    fullPage: false,
  });

  const routes = [
    ["/", "Thoughtful care"],
    ["/discover", "Find someone"],
    ["/book/1", "Book a visit"],
    ["/book/2", "Book a visit"],
    ["/book/3", "Book a visit"],
    ["/family-onboarding", "Create your care preferences"],
    ["/caregiver-onboarding", "Apply to care nearby"],
    ["/visits", "What is happening"],
    ["/requests", "Requests that fit"],
  ];
  for (const [route, text] of routes) {
    await page.goto(`${baseUrl}/#${route}`, { waitUntil: "networkidle" });
    assert.match(await page.locator("main").innerText(), new RegExp(text));
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
      true,
      `${route} overflows at 320px`,
    );
    await assertNoVisibleSmallText(page, `${route} at 320px`);
  }
  assert.deepEqual(consoleErrors, []);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => ({
    width: getComputedStyle(document.activeElement).outlineWidth,
    style: getComputedStyle(document.activeElement).outlineStyle,
  }));
  assert.equal(focus.width, "3px");
  assert.notEqual(focus.style, "none");

  console.log("theme: local Playfair Display and DM Sans, Gentiva palette, black action and card shadow passed");
  console.log("landing: 50-56px two-line hero, anchored search, social proof and aligned cards passed");
  console.log("responsive: 390px mobile order and 320px route reflow passed");
  console.log("motion: reduced-motion transitions reduced to 0.01ms");
  console.log("routes: all hash screens rendered without console errors");
} finally {
  await browser.close();
}
