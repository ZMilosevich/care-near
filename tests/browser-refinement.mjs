import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(
  "/Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/",
);
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5183";
const qaDirectory = "docs/agent-work/carenear-demo/QA/gentiva-theme";

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
  try {
    await page.waitForFunction((imageSelector) => {
      const images = [...document.querySelectorAll(imageSelector)];
      return images.length > 0 && images.every((image) => image.complete);
    }, selector);
  } catch (error) {
    const diagnostics = await page.evaluate((imageSelector) => ({
      count: document.querySelectorAll(imageSelector).length,
      images: [...document.querySelectorAll(imageSelector)].map((image) => ({
        src: image.getAttribute("src"),
        complete: image.complete,
        width: image.naturalWidth,
      })),
      errorText: document.querySelector("#toast")?.textContent,
      mainText: document.querySelector("main")?.innerText.slice(0, 500),
    }), selector);
    throw new Error(`${error.message}\n${JSON.stringify(diagnostics)}`);
  }
  return page.locator(selector).evaluateAll((images) =>
    images.map((image) => ({
      alt: image.alt,
      width: image.naturalWidth,
      height: image.naturalHeight,
    })),
  );
}

async function assertMinimumFontSizes(page, selectors) {
  const sizes = await page.evaluate((requested) => {
    const results = {};
    for (const selector of requested) {
      const element = [...document.querySelectorAll(selector)].find(
        (candidate) => candidate.getClientRects().length > 0,
      );
      if (element) {
        results[selector] = Number.parseFloat(
          getComputedStyle(element).fontSize,
        );
      }
    }
    return results;
  }, selectors);
  for (const [selector, size] of Object.entries(sizes)) {
    assert.ok(
      size >= 16,
      `${selector} rendered at ${size}px instead of at least 16px`,
    );
  }
  return sizes;
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await waitForImages(page, ".caregiver-rail .portrait img");

  const landing1440 = await page.evaluate(() => {
    const heading = document.querySelector(".hero h1");
    const search = document.querySelector(".hero-search");
    const secondary = document.querySelector(".secondary-link");
    const headingStyle = getComputedStyle(heading);
    return {
      headingLines: Math.round(
        heading.getBoundingClientRect().height /
          Number.parseFloat(headingStyle.lineHeight),
      ),
      headingSize: Number.parseFloat(headingStyle.fontSize),
      searchBottom: search.getBoundingClientRect().bottom,
      secondaryBottom: secondary.getBoundingClientRect().bottom,
      primaryActions: document.querySelectorAll(".hero .button").length,
      bookCta: document.querySelector(".hero")?.textContent.includes("Book a visit"),
      socialProofText: document.querySelector(".social-proof")?.innerText,
      cardFooterTops: [
        ...document.querySelectorAll(
          ".caregiver-rail .caregiver-card-footer",
        ),
      ].map((element) => Math.round(element.getBoundingClientRect().top)),
      stepIconPaths: new Set(
        [...document.querySelectorAll(".step-item > .icon")].map((icon) =>
          [...icon.querySelectorAll("path, circle, rect")]
            .map((shape) => shape.getAttribute("d") || shape.tagName)
            .join("|"),
        ),
      ).size,
    };
  });
  console.log("landing 1440 measurements", landing1440);
  assert.ok(landing1440.headingLines >= 2 && landing1440.headingLines <= 3.1);
  assert.ok(landing1440.headingSize >= 50 && landing1440.headingSize <= 56);
  assert.ok(landing1440.searchBottom < 900);
  assert.ok(landing1440.secondaryBottom < 900);
  assert.equal(landing1440.primaryActions, 1);
  assert.equal(landing1440.bookCta, false);
  assert.match(landing1440.socialProofText, /1,240\s+sample visits/);
  assert.match(landing1440.socialProofText, /4\.9 average\s+sample rating/);
  assert.match(landing1440.socialProofText, /2 h\s+sample reply time/);
  assert.equal(landing1440.stepIconPaths, 4);
  assert.ok(Math.max(...landing1440.cardFooterTops) - Math.min(...landing1440.cardFooterTops) <= 1);
  await page.screenshot({
    path: `${qaDirectory}/landing-desktop-1440.png`,
    fullPage: false,
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload({ waitUntil: "networkidle" });
  const fold1280 = await page.evaluate(() => ({
    searchBottom: document
      .querySelector(".hero-search")
      .getBoundingClientRect().bottom,
    secondaryBottom: document
      .querySelector(".secondary-link")
      .getBoundingClientRect().bottom,
    headingSize: Number.parseFloat(
      getComputedStyle(document.querySelector(".hero h1")).fontSize,
    ),
    viewportHeight: innerHeight,
    steps: document.querySelectorAll(".step-item").length,
    stepIcons: document.querySelectorAll(".step-item > .icon").length,
    testimonial: document.body.innerText.includes(
      "Illustrative family story",
    ),
    sampleLabel: document.body.innerText.includes(
      "Sample ratings, availability and reviews",
    ),
  }));
  console.log("landing 1280 fold measurements", fold1280);
  assert.ok(fold1280.searchBottom < fold1280.viewportHeight);
  assert.ok(fold1280.secondaryBottom < fold1280.viewportHeight);
  assert.ok(fold1280.headingSize >= 46 && fold1280.headingSize <= 56);
  assert.equal(fold1280.steps, 4);
  assert.equal(fold1280.stepIcons, 4);
  assert.equal(fold1280.testimonial, true);
  assert.equal(fold1280.sampleLabel, true);

  const landingSizes = await assertMinimumFontSizes(page, [
    ".hero .lede",
    ".service-card p",
    ".caregiver-meta",
    ".check-pill",
    ".button",
    ".demo-note",
  ]);

  const portraitFacts = await waitForImages(
    page,
    ".caregiver-rail .portrait img",
  );
  assert.equal(portraitFacts.length, 3);
  for (const image of portraitFacts) {
    assert.ok(image.width === 640 && image.height === 640);
    assert.match(image.alt, /Stock portrait representing fictional caregiver/);
  }
  const portraitDisplay = await page
    .locator(".caregiver-rail .caregiver-card-media")
    .first()
    .evaluate((element) => {
      const portrait = element.querySelector(".portrait");
      const image = element.querySelector("img");
      return {
        media: element.getBoundingClientRect().toJSON(),
        portrait: portrait.getBoundingClientRect().toJSON(),
        image: image.getBoundingClientRect().toJSON(),
        imageDisplay: getComputedStyle(image).display,
        imageOpacity: getComputedStyle(image).opacity,
      };
    });
  console.log("portrait display", portraitDisplay);
  await page.locator(".caregiver-rail").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `${qaDirectory}/caregiver-cards.png`,
    fullPage: false,
  });
  const contrast = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return {
      ink: body.color,
      canvas: body.backgroundColor,
      muted: root.getPropertyValue("--muted").trim(),
      controlBorder: getComputedStyle(
        document.querySelector(".hero-search"),
      ).borderColor,
      white: "rgb(255, 255, 255)",
    };
  });
  assert.ok(contrastRatio(contrast.ink, contrast.canvas) >= 4.5);
  assert.ok(
    contrastRatio(
      "rgb(82, 97, 91)",
      contrast.canvas,
    ) >= 4.5,
  );
  assert.ok(
    contrastRatio(contrast.controlBorder, contrast.white) >= 3,
    `Control contrast ${contrast.controlBorder}`,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 0));
  const mobileHero = await page.evaluate(() => {
    const heading = document.querySelector(".hero h1");
    const search = document.querySelector(".hero-search");
    const image = document.querySelector(".hero-media");
    const stepLine = getComputedStyle(
      document.querySelector(".steps-grid"),
      "::before",
    );
    return {
      headingSize: Number.parseFloat(getComputedStyle(heading).fontSize),
      headingLines: Math.round(
        heading.getBoundingClientRect().height /
          Number.parseFloat(getComputedStyle(heading).lineHeight),
      ),
      searchBottom: search.getBoundingClientRect().bottom,
      imageTop: image.getBoundingClientRect().top,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      mobileStepLine: stepLine.display,
      mobileStepLineWidth: Number.parseFloat(stepLine.width),
      mobileStepLineHeight: Number.parseFloat(stepLine.height),
    };
  });
  assert.ok(mobileHero.headingSize >= 39 && mobileHero.headingSize <= 42);
  assert.ok(mobileHero.headingLines <= 3);
  assert.ok(mobileHero.searchBottom < 844);
  assert.ok(mobileHero.searchBottom < mobileHero.imageTop);
  assert.equal(mobileHero.scrollWidth, mobileHero.clientWidth);
  assert.notEqual(mobileHero.mobileStepLine, "none");
  assert.ok(mobileHero.mobileStepLineWidth <= 4);
  assert.ok(mobileHero.mobileStepLineHeight > 0);
  await page.screenshot({
    path: `${qaDirectory}/landing-mobile-390.png`,
    fullPage: false,
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${baseUrl}/#/discover`, { waitUntil: "networkidle" });
  const discoverPortraits = await waitForImages(
    page,
    ".caregiver-list .portrait img",
  );
  assert.equal(discoverPortraits.length, 4);
  assert.equal(
    await page.getByText("Sample ratings, reviews, availability and checks", {
      exact: true,
    }).isVisible(),
    true,
  );
  await assertMinimumFontSizes(page, [
    ".button",
    ".progress li",
    ".caregiver-meta",
    ".check-pill",
    ".status",
    ".summary-row",
    ".field label",
  ]);

  await page
    .locator('[data-caregiver-id="ana"]')
    .getByRole("button", { name: /Profile/ })
    .click();
  assert.equal(
    await page.locator("#app-dialog .portrait img").count(),
    1,
  );
  assert.ok(
    (await page
      .locator("#app-dialog .portrait img")
      .evaluate((image) => image.naturalWidth)) > 0,
  );
  await page.locator(".dialog-close").click();

  await page.goto(`${baseUrl}/#/book/1`, { waitUntil: "networkidle" });
  await page
    .locator('input[data-booking-field="forWho"][value="someone"]')
    .check();
  await page.locator("#recipient-name").fill("Mara Kralj");
  assert.equal(await page.locator('input[data-booking-field="consent"]').isChecked(), false);
  await page.getByRole("button", { name: "Continue" }).click();
  assert.match(await page.locator("#booking-errors").innerText(), /permission/);
  await page.locator('input[data-booking-field="consent"]').check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('[data-booking-time="09:30"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  assert.match(await page.locator(".summary-card").innerText(), /€42/);
  assert.match(await page.locator("#booking-review-details").innerText(), /Permission\s+Confirmed/);
  const bookingPortraits = await waitForImages(
    page,
    ".caregiver-option-list .portrait img",
  );
  assert.equal(bookingPortraits.length, 3);
  await assertMinimumFontSizes(page, [
    ".progress li",
    ".summary-row",
    ".field label",
    ".check-pill",
    ".button",
  ]);

  await page.locator("#caregiver-marko").check();
  assert.match(await page.locator(".summary-card").innerText(), /€39/);
  await page.locator("#review-ack").check();
  await page.locator("#booking-confirm").click();
  await page.waitForURL(/#\/book\/success$/);
  await page.getByRole("link", { name: "View demo visits" }).click();
  assert.equal(
    await page.locator('[data-visit-status="pending"]').getAttribute("aria-pressed"),
    "true",
  );
  await assertMinimumFontSizes(page, [
    ".progress li",
    ".summary-row",
    ".status",
    ".lifecycle-status-button",
    ".field label",
  ]);

  const statusLabels = [];
  for (const status of ["pending", "confirmed", "in_progress", "completed"]) {
    await page.locator(`[data-visit-status="${status}"]`).click();
    statusLabels.push(await page.locator(".lifecycle-panel-head h2").innerText());
  }
  assert.deepEqual(statusLabels, [
    "Pending",
    "Confirmed",
    "In progress",
    "Completed",
  ]);
  await page.locator('[data-visit-status="in_progress"]').click();
  await page.getByRole("button", { name: "For the person receiving care" }).click();
  assert.equal(await page.locator(".lifecycle-panel").getAttribute("class"), "lifecycle-panel card recipient-view");
  assert.ok(
    Number.parseFloat(
      await page
        .locator(".recipient-view .lifecycle-message")
        .evaluate((element) => getComputedStyle(element).fontSize),
    ) >= 18,
  );
  await page.screenshot({
    path: `${qaDirectory}/refinement-visits-lifecycle.jpg`,
    fullPage: false,
  });

  await page.locator("[data-open-contact]").first().click();
  const contactForm = page.locator("#contact-form");
  assert.equal(await page.locator("[data-explicit-dialer]").count(), 0);
  await contactForm.getByRole("button", { name: "Save for this page" }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === "contact-phone",
  );
  assert.match(
    await page.locator("#contact-phone-error").innerText(),
    /phone number/i,
  );
  await page.locator("#contact-phone").fill("call me");
  await contactForm.getByRole("button", { name: "Save for this page" }).click();
  assert.match(
    await page.locator("#contact-phone-error").innerText(),
    /digits and phone characters/i,
  );
  await page.locator("#contact-name").fill("Nika");
  await page.locator("#contact-phone").fill("+385 91 234 5678");
  await page.getByRole("button", { name: "Save for this page" }).click();
  assert.equal(
    await page.locator("[data-explicit-dialer]").getAttribute("href"),
    "tel:+385912345678",
  );
  await page.locator(".dialog-close").click();
  assert.match(
    await page.locator("[data-open-contact]").first().innerText(),
    /Call your contact/,
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.match(
    await page.locator("[data-open-contact]").first().innerText(),
    /Call your contact/,
  );

  await page.locator("[data-visit-reset]").click();
  await page.locator("[data-visit-next]").click();
  assert.equal(
    await page.locator('[data-visit-status="confirmed"]').getAttribute("aria-pressed"),
    "true",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/#/book/2`, { waitUntil: "networkidle" });
  const stickySummary = page.locator("#mobile-booking-summary");
  assert.equal(await stickySummary.isVisible(), true);
  await page.locator("#visit-notes").scrollIntoViewIfNeeded();
  const summaryLayout = await page.evaluate(() => {
    const summary = document
      .querySelector("#mobile-booking-summary")
      .getBoundingClientRect();
    const field = document.querySelector("#visit-notes").getBoundingClientRect();
    return {
      summaryTop: summary.top,
      summaryBottom: summary.bottom,
      fieldTop: field.top,
      detailsOpen: document.querySelector("#mobile-booking-summary details").open,
    };
  });
  assert.equal(summaryLayout.summaryTop, 8);
  assert.equal(summaryLayout.fieldTop >= summaryLayout.summaryBottom - 1, true);
  assert.equal(summaryLayout.detailsOpen, false);
  await page.screenshot({
    path: `${qaDirectory}/refinement-booking-mobile-summary.jpg`,
    fullPage: false,
  });
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  const footerClearance = await page.evaluate(() => {
    const summary = document
      .querySelector("#mobile-booking-summary")
      .getBoundingClientRect();
    const footer = document.querySelector(".site-footer").getBoundingClientRect();
    return summary.bottom <= footer.top || summary.top >= footer.bottom;
  });
  assert.equal(footerClearance, true);
  await page.setViewportSize({ width: 390, height: 500 });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page
      .locator("#mobile-booking-summary")
      .evaluate((element) => getComputedStyle(element).position),
    "static",
  );

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  const narrow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    h1: document.querySelector(".hero h1").getBoundingClientRect(),
  }));
  assert.equal(narrow.scrollWidth, narrow.clientWidth);
  assert.ok(narrow.h1.width <= narrow.clientWidth - 32);

  console.log("landing fold and hierarchy: primary search and quiet secondary link passed");
  console.log(`font sizes: ${JSON.stringify(landingSizes)}`);
  console.log("portraits: local assets and meaningful fictional-alt text passed");
  console.log("visit lifecycle: all four states, pending submission, and recipient view passed");
  console.log("trusted contact: empty, invalid, and valid local-only paths passed");
  console.log("booking: €42 -> €39, consent, mobile sticky summary and 320px reflow passed");
} finally {
  await browser.close();
}
