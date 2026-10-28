import assert from "node:assert/strict";
import { request } from "node:http";
import { createRequire } from "node:module";

const require = createRequire(
  "/Users/zmilosevich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/",
);
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5183";
const qaDirectory = "docs/agent-work/carenear-demo/QA/gentiva-theme";

function addDaysISO(dateISO, amount) {
  const date = new Date(`${dateISO}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function todayInAmsterdam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const read = (type) => parts.find((part) => part.type === type)?.value;
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function malformedRequestStatus() {
  const endpoint = new URL(baseUrl);
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: endpoint.hostname,
        port: endpoint.port,
        path: "/%E0%A4%A",
        method: "GET",
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve(response.statusCode));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseUrl}/#/book/1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('[data-booking-time="09:30"]').click();
  await page.getByRole("button", { name: "Continue" }).click();

  assert.match(
    await page.locator(".summary-card").innerText(),
    /Sanne de Vries/,
  );
  assert.match(await page.locator(".summary-card").innerText(), /€42/);
  assert.match(
    await page.locator("#booking-review-details").innerText(),
    /€42/,
  );

  await page.locator("#review-ack").check();
  await page.locator("#caregiver-marko").check();
  assert.match(
    await page.locator(".summary-card").innerText(),
    /Daan van Dijk/,
  );
  assert.match(await page.locator(".summary-card").innerText(), /€39/);
  assert.match(
    await page.locator("#booking-review-details").innerText(),
    /Daan van Dijk/,
  );
  assert.match(
    await page.locator("#booking-review-details").innerText(),
    /€39/,
  );
  assert.equal(await page.locator("#review-ack").isChecked(), false);
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "caregiver-marko",
  );
  assert.equal(await page.locator("#booking-confirm").isDisabled(), true);

  await page.locator("#review-ack").check();
  await page.locator("#caregiver-ivana").check();
  assert.match(
    await page.locator(".summary-card").innerText(),
    /Lotte Jansen/,
  );
  assert.match(await page.locator(".summary-card").innerText(), /€45/);
  assert.match(
    await page.locator("#booking-review-details").innerText(),
    /Lotte Jansen/,
  );
  assert.match(
    await page.locator("#booking-review-details").innerText(),
    /€45/,
  );
  assert.equal(await page.locator("#review-ack").isChecked(), false);
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "caregiver-ivana",
  );

  await page.locator("#review-ack").check();
  await page.screenshot({
    path: `${qaDirectory}/booking-review-desktop.png`,
    fullPage: true,
  });
  await page.locator("#booking-confirm").click();
  await page.waitForURL(/#\/book\/success$/);
  const successText = await page.locator("main").innerText();
  assert.match(successText, /Lotte Jansen/);
  assert.match(successText, /€45/);
  console.log(
    "booking totals and focus: Sanne €42 -> Daan €39 -> Lotte €45; submitted Lotte €45",
  );

  await page.goto(`${baseUrl}/#/book/1`, { waitUntil: "networkidle" });
  await page
    .locator('input[data-booking-field="forWho"][value="someone"]')
    .check();
  await page.locator("#recipient-name").fill("Mila Smit");
  assert.match(await page.locator(".summary-card").innerText(), /Mila Smit/);
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "recipient-name",
  );
  await page.locator('input[data-booking-field="service"][value="errands"]').check();
  assert.match(await page.locator(".summary-card").innerText(), /Errands/);
  assert.equal(
    await page.evaluate(
      () =>
        document.activeElement?.dataset.bookingField === "service" &&
        document.activeElement?.value,
    ),
    "errands",
  );

  await page.goto(`${baseUrl}/#/discover`, { waitUntil: "networkidle" });
  await page.getByLabel("Service").selectOption("errands");
  await page
    .locator('[data-caregiver-id="ana"] [data-book-caregiver="ana"]')
    .click();
  assert.equal(
    await page
      .locator('input[data-booking-field="service"][value="errands"]')
      .isChecked(),
    true,
  );

  await page.goto(`${baseUrl}/#/discover`, { waitUntil: "networkidle" });
  await page.getByLabel("Service").selectOption("check-in");
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await page
    .locator('[data-caregiver-id="ivana"]')
    .getByRole("button", { name: "Profile" })
    .click();
  await page.locator("[data-dialog-book]").click();
  assert.equal(
    await page
      .locator('input[data-booking-field="service"][value="check-in"]')
      .isChecked(),
    true,
  );

  await page.goto(`${baseUrl}/#/discover`, { waitUntil: "networkidle" });
  await page.getByLabel("Service").selectOption("errands");
  await page.goto(`${baseUrl}/#/`, { waitUntil: "networkidle" });
  await page
    .locator('[data-caregiver-id="ivana"]')
    .getByRole("button", { name: "Profile" })
    .click();
  await page.locator("[data-dialog-book]").click();
  assert.equal(
    await page
      .locator('input[data-booking-field="service"][value="appointment"]')
      .isChecked(),
    true,
  );
  console.log(
    "service preservation: supported filters retained; unsupported filter fell back to first service",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/#/book/2`, { waitUntil: "networkidle" });
  const mobileDate = page.locator("#mobile-visit-date");
  assert.equal(await mobileDate.isVisible(), true);
  const testToday = todayInAmsterdam();
  const futureDate = addDaysISO(testToday, 60);
  const nearbyDate = addDaysISO(testToday, 1);
  assert.equal(await mobileDate.getAttribute("min"), testToday);
  await mobileDate.fill(futureDate);
  assert.equal(await mobileDate.inputValue(), futureDate);
  assert.match(
    await page.locator(".summary-card").innerText(),
    new RegExp(futureDate.slice(8).replace(/^0/, "")),
  );
  assert.equal(await page.evaluate(() => document.activeElement?.id), "mobile-visit-date");
  await page.locator('[data-booking-time="14:00"]').click();
  assert.equal(await page.locator("#mobile-visit-date").inputValue(), futureDate);
  await page
    .locator(`.mobile-date-agenda [data-booking-date="${nearbyDate}"]`)
    .click();
  await page.waitForFunction(
    () => document.activeElement?.id === "mobile-visit-date",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "mobile-visit-date",
  );
  console.log(
    "mobile date: future date persisted and visible date field retained focus",
  );
  await page.screenshot({
    path: `${qaDirectory}/booking-mobile-date.png`,
    fullPage: false,
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${baseUrl}/#/family-onboarding`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === "onboarding-errors",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "onboarding-errors",
  );
  assert.match(
    await page.locator("#onboarding-errors").innerText(),
    /Please check the highlighted fields/,
  );
  assert.equal(
    await page
      .locator('input[data-family-field="relationship"]')
      .first()
      .getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(
    await page
      .locator('input[data-family-field="relationship"]')
      .first()
      .getAttribute("aria-describedby"),
    "family-relationship-error",
  );
  await page.screenshot({
    path: `${qaDirectory}/onboarding-errors.png`,
    fullPage: false,
  });

  await page
    .locator('input[data-family-field="relationship"][value="parent"]')
    .check();
  await page.locator('input[data-family-service="appointment"]').check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === "onboarding-step-heading",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "onboarding-step-heading",
  );
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === "onboarding-step-heading",
  );

  await page.goto(`${baseUrl}/#/caregiver-onboarding`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === "onboarding-errors",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "onboarding-errors",
  );
  assert.match(
    await page.locator("#onboarding-errors").innerText(),
    /Tell us briefly about your experience/,
  );
  assert.equal(
    await page
      .locator("#caregiver-experience")
      .getAttribute("aria-describedby"),
    "caregiver-experience-error",
  );
  await page
    .locator("#caregiver-experience")
    .fill("Three years of local care support in Amsterdam.");
  await page.locator('input[data-caregiver-language="Dutch"]').check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === "onboarding-step-heading",
  );
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForFunction(
    () => document.activeElement?.id === "onboarding-step-heading",
  );
  console.log(
    "onboarding: error summaries announced, ARIA associations present, Continue and Back focus handled",
  );

  assert.equal(await malformedRequestStatus(), 400);
  console.log("server: malformed encoded path returned 400");
  console.log("browser corrections: all focused assertions passed");
} finally {
  await browser.close();
}
